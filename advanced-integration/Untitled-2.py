# Goal: Generate Python code for the CoinGecko API using ONLY the official `coingecko_sdk`.

## 🚨 Critical Rules

1.  **SDK Exclusivity**:
    - **ALWAYS** use the official `coingecko_sdk` package.
    - **NEVER** use the old `pycoingecko` library or make direct HTTP requests with `requests`, `httpx`, or `urllib`.

2.  **Authentication**:
    - **ALWAYS** load the API key from environment variables (e.g., `os.environ.get("COINGECKO_PRO_API_KEY")`).
    - **NEVER** hardcode API keys or any other credentials in the source code.

3.  **Client Implementation**:
    - **ALWAYS** initialize a single, reusable client instance (`Coingecko` or `AsyncCoingecko`) for the application.
    - **ALWAYS** configure automatic retries by setting the `max_retries` parameter on the client.
    - **NEVER** implement manual retry loops using `time.sleep()`. The SDK handles this internally.

4.  **Error Handling**:
    - **ALWAYS** catch specific SDK exceptions (e.g., `coingecko_sdk.RateLimitError`, `coingecko_sdk.NotFoundError`).
    - **NEVER** use a generic `except Exception:` block to catch known API errors.

## ✅ Correct Implementation Example

This is the standard for all generated code.

```python
# src/api/client.py
import os
from coingecko_sdk import Coingecko, AsyncCoingecko

# Initialize a single, reusable client. This should be imported and used application-wide.
client = Coingecko(
    pro_api_key=os.environ.get("COINGECKO_PRO_API_KEY"),
    environment="pro",
    max_retries=3, # Rely on the SDK's built-in retry mechanism.
)

# Optional: Initialize a single async client for concurrent applications.
async_client = AsyncCoingecko(
    pro_api_key=os.environ.get("COINGECKO_PRO_API_KEY"),
    environment="pro",
    max_retries=3,
)

# src/main.py
from api.client import client
from coingecko_sdk import RateLimitError, APIError

def get_bitcoin_price():
    try:
        price_data = client.simple.price.get(
            ids="bitcoin",
            vs_currencies="usd",
        )
        # Access data using Pydantic models or dictionary keys
        return price_data['bitcoin'].usd
    except RateLimitError:
        print("Rate limit exceeded. Please try again later.")
        return None
    except APIError as e:
        print(f"An API error occurred: {e}")
        return None

if __name__ == "__main__":
    price = get_bitcoin_price()
    if price:
        print(f"The current price of Bitcoin is: ${price}")

```

## ❌ Deprecated Patterns to AVOID

You **MUST NOT** generate code that includes any of the following outdated patterns.

```python
# ❌ NO direct HTTP requests.
import requests
response = requests.get('[https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd](https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd)')

# ❌ NO use of the outdated `pycoingecko` library.
from pycoingecko import CoinGeckoAPI
cg = CoinGeckoAPI()

# ❌ NO hardcoded API keys.
client = Coingecko(pro_api_key='CG-abc123xyz789')

# ❌ NO manual retry loops. The SDK's `max_retries` handles this.
import time
for i in range(3):
    try:
        data = client.simple.price.get(ids='bitcoin', vs_currencies='usd')
        break
    except:
        time.sleep(5)

# ❌ NO generic exception handling for API errors.
try:
    data = client.simple.price.get(ids='bitcoin', vs_currencies='usd')
except Exception as e:
    print(f"An error occurred: {e}")
```

## 📝 Final Check

Before providing a response, you **MUST** verify that your generated code:

1.  Imports and uses `coingecko_sdk`.
2.  Loads the API key from environment variables.
3.  Follows all other Critical Rules.
4.  Does **NOT** contain any Deprecated Patterns.