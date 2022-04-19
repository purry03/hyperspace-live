// setInterval(() => {
//     $.get("/keep-alive", function (res) {
//     });
// }, 1000);

function pauseStream() {
    $("#player").prop("volume", 0);
    $(".controls img").attr("src", "/img/play.png");
}

function playStream() {
    $("#player").get(0).play();
    $("#player").prop("volume", 1);
    $(".controls img").attr("src", "/img/pause.png");
}

$(".controls img").on("click", function () {
    const src = $(this).attr("src");
    if (src == "/img/play.png") {
        playStream();
    }
    else {
        pauseStream();
    }
})