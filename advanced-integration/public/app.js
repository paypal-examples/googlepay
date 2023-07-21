/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */


/**
 * An initialized google.payments.api.PaymentsClient object or null if not yet set
 * An initialized paypal.Googlepay().config() response object or null if not yet set
 *
 * @see {@link getGooglePaymentsClient}
 */
let paymentsClient = null, googlepayConfig = null;


/**
 * 
 * @returns Fetch the Google Pay Config From PayPal 
 */
async function getGooglePayConfig(){
  if(googlepayConfig === null){
    googlepayConfig = await paypal.Googlepay().config();
    console.log(" ===== Google Pay Config Fetched ===== ");

  }
  return googlepayConfig;
}

/**
 * Configure support for the Google Pay API
 *
 * @see {@link https://developers.google.com/pay/api/web/reference/request-objects#PaymentDataRequest|PaymentDataRequest}
 * @returns {object} PaymentDataRequest fields
 */
async function getGooglePaymentDataRequest() {
  const {allowedPaymentMethods,merchantInfo, apiVersion, apiVersionMinor , countryCode} = await getGooglePayConfig();
  const baseRequest = {
    apiVersion,
    apiVersionMinor
  }
  const paymentDataRequest = Object.assign({}, baseRequest);

  paymentDataRequest.allowedPaymentMethods = allowedPaymentMethods;
  paymentDataRequest.transactionInfo = getGoogleTransactionInfo(countryCode);
  paymentDataRequest.merchantInfo =merchantInfo;

  paymentDataRequest.callbackIntents = ["PAYMENT_AUTHORIZATION"];

  return paymentDataRequest;
}

  /**
 * Handles authorize payments callback intents.
 *
 * @param {object} paymentData response from Google Pay API after a payer approves payment through user gesture.
 * @see {@link https://developers.google.com/pay/api/web/reference/response-objects#PaymentData object reference}
 *
 * @see {@link https://developers.google.com/pay/api/web/reference/response-objects#PaymentAuthorizationResult}
 * @returns Promise<{object}> Promise of PaymentAuthorizationResult object to acknowledge the payment authorization status.
 */
  function onPaymentAuthorized(paymentData) {
    return new Promise(function(resolve, reject) {
      processPayment(paymentData)
        .then(function() {
          resolve({transactionState: 'SUCCESS'});
        })
        .catch(function() {
          resolve({transactionState: 'ERROR'});
        });
    });
  }
  

/**
 * Return an active PaymentsClient or initialize
 *
 * @see {@link https://developers.google.com/pay/api/web/reference/client#PaymentsClient|PaymentsClient constructor}
 * @returns {google.payments.api.PaymentsClient} Google Pay API client
 */
function getGooglePaymentsClient() {
  if (paymentsClient === null) {
    paymentsClient = new google.payments.api.PaymentsClient({
      environment: 'TEST',
      paymentDataCallbacks: {
        onPaymentAuthorized: onPaymentAuthorized
      }
    });
  }
  return paymentsClient;
}




/**
 * Initialize Google PaymentsClient after Google-hosted JavaScript has loaded
 *
 * Display a Google Pay payment button after confirmation of the viewer's
 * ability to pay.
 */
async function onGooglePayLoaded() {
  const paymentsClient = getGooglePaymentsClient();
  const { allowedPaymentMethods, apiVersion, apiVersionMinor } = await getGooglePayConfig();
  paymentsClient.isReadyToPay({allowedPaymentMethods, apiVersion,apiVersionMinor})
    .then(function(response) {
      if (response.result) {
        addGooglePayButton();
      }
    })
    .catch(function(err) {
      // show error in developer console for debugging
      console.error(err);
    });
}

/**
 * Add a Google Pay purchase button alongside an existing checkout button
 *
 * @see {@link https://developers.google.com/pay/api/web/reference/request-objects#ButtonOptions|Button options}
 * @see {@link https://developers.google.com/pay/api/web/guides/brand-guidelines|Google Pay brand guidelines}
 */
function addGooglePayButton() {
  const paymentsClient = getGooglePaymentsClient();
  const button =
    paymentsClient.createButton({
      onClick: onGooglePaymentButtonClicked
    });
  document.getElementById('container').appendChild(button);
}

/**
 * Provide Google Pay API with a payment amount, currency, and amount status
 *
 * @see {@link https://developers.google.com/pay/api/web/reference/request-objects#TransactionInfo|TransactionInfo}
 * @returns {object} transaction info, suitable for use as transactionInfo property of PaymentDataRequest
 */
function getGoogleTransactionInfo(countryCode) {
  return {
    displayItems: [{
        label: "Subtotal",
        type: "SUBTOTAL",
        price: "0.09",
      },
      {
        label: "Tax",
        type: "TAX",
        price: "0.01",
      }
    ],
    countryCode: countryCode,
    currencyCode: "USD",
    totalPriceStatus: "FINAL",
    totalPrice: "0.10",
    totalPriceLabel: "Total"
  };
}


/**
 * Show Google Pay payment sheet when Google Pay payment button is clicked
 */
async function onGooglePaymentButtonClicked() {
  const paymentDataRequest = await getGooglePaymentDataRequest();
  const paymentsClient = getGooglePaymentsClient();
  paymentsClient.loadPaymentData(paymentDataRequest);
}

/**
 * Process payment data returned by the Google Pay API
 *
 * @param {object} paymentData response from Google Pay API after user approves payment
 * @see {@link https://developers.google.com/pay/api/web/reference/response-objects#PaymentData|PaymentData object reference}
 */
async function processPayment(paymentData) {
  const resultElement = document.getElementById("result");
  const modal = document.getElementById("resultModal");
  resultElement.innerHTML = ""
  try {  
    const { id } = await fetch(`/api/orders`,{
      method:'POST',
      headers : {
        'Content-Type': 'application/json'
      }
    }).then((res) => res.json());

  console.log(" ===== Order Created ===== ");
  /** Approve Payment */

  const {status} = await paypal.Googlepay().confirmOrder({
    orderId: id,
    paymentMethodData: paymentData.paymentMethodData
  });

    if(status === 'PAYER_ACTION_REQUIRED'){
          console.log(" ===== Confirm Payment Completed Payer Action Required ===== ")
          paypal.Googlepay().initiatePayerAction({orderId: id}).then( async () => {

                /**
                 *  GET Order 
                 */
                const orderResponse = await fetch(`/api/orders/${id}`, {
                  method: "GET"
                }).then(res =>res.json())

                console.log(" ===== 3DS Contingency Result Fetched ===== ");
                console.log(orderResponse?.payment_source?.google_pay?.card?.authentication_result)
                /*
                 * CAPTURE THE ORDER
                 */
                console.log(" ===== Payer Action Completed ===== ")

                modal.style.display = "block";
                resultElement.classList.add("spinner");
                const captureResponse = await fetch(`/api/orders/${id}/capture`, {
                  method: "POST"
                }).then(res =>res.json())

                console.log(" ===== Order Capture Completed ===== ")
                resultElement.classList.remove("spinner");
                resultElement.innerHTML = prettyPrintJson.toHtml(captureResponse,{
                  indent: 2
                });
                

          })
    } else {
        /*
         * CAPTURE THE ORDER
         */
        
        const response = await fetch(`/api/orders/${id}/capture`, {
                  method: "POST"
        }).then(res =>res.json())

        console.log(" ===== Order Capture Completed ===== ")
        modal.style.display = "block";
        resultElement.innerHTML = prettyPrintJson.toHtml(response,{
          indent: 2
        });
        
    }

  return { transactionState: 'SUCCESS' }


} catch(err){
  return {
    transactionState: 'ERROR',
    error: {
      message: err.message
    }
  }
}
}
