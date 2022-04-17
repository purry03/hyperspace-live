if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
        title: 'Hyperspace',
        artist: 'Lo-Fi Stream'
    });

    navigator.mediaSession.setActionHandler('play', function () { playStream() });
    navigator.mediaSession.setActionHandler('pause', function () { pauseStream() });
    navigator.mediaSession.setActionHandler('stop', function () { $("#player").attr("src", ""); });
};