/** Get the Result Modal and Attach a Window Listner to Close when user clicks anywhere */
 const modal = document.getElementById('resultModal');

 window.onclick = function(event) {
   if (event.target == modal) {
     modal.style.display = "none";
   }
}