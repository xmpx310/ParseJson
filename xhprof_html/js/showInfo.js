$(document).ready(function(){
 //$(window.frames["menu"].document).find(".view").text();
    var object =window.parent.frames["menu"].document.getElementsByClassName("view")[0];
    var date = object.innerHTML;
    $("a").each(function(){
        var href = $(this).attr('href');
        href  = href + '&date=' + date;
        $(this).attr('href',href);
    })
})