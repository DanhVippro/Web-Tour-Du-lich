function showContent(type, el) {
    
    document.getElementById("trongnuoc").style.display = "none";
    document.getElementById("nuocngoai").style.display = "none";


    document.getElementById(type).style.display = "block";


    let tabs = document.querySelectorAll(".tab");
    tabs.forEach(t => t.classList.remove("active"));

   
    el.classList.add("active");
}