function showContent(type, el) {
    
    document.getElementById("trongnuoc").style.display = "none";
    document.getElementById("nuocngoai").style.display = "none";


    document.getElementById(type).style.display = "block";


    let tabs = document.querySelectorAll(".tab");
    tabs.forEach(t => t.classList.remove("active"));

   
    el.classList.add("active");

    if (type === "trongnuoc") {

       
        document.getElementById("bac").style.display = "block";
        document.getElementById("trung").style.display = "none";
        document.getElementById("nam").style.display = "none";

        
        let subTabs = document.querySelectorAll(".subtab");

        subTabs.forEach(t => t.classList.remove("active"));

        subTabs[0].classList.add("active");
    }



}
function showRegion(region, el) {

  
    document.getElementById("bac").style.display = "none";
    document.getElementById("trung").style.display = "none";
    document.getElementById("nam").style.display = "none";

    
    document.getElementById(region).style.display = "block";

    let subTabs = document.querySelectorAll(".subtab");

    subTabs.forEach(t => t.classList.remove("active"));

    el.classList.add("active");
}