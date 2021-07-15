/* global $, JitsiMeetJS */
let mcu = {};
let send_back_mcu_to_sfu = true

mcu.main = (media_stream) => new Promise((resolve, reject) => {
    console.log("---media_stream", media_stream.getTracks())

    try {
        let count = 1
        function createPeer() {
            let peer = new RTCPeerConnection({
                iceServers: [{
                    urls: ["stun:us-turn1.xirsys.com"]
                }, {
                    username: "aeBvNoa7ckuGqJ79zRuW5VoDqlOjOlv40EdgmklPH0XdqjYr_i6-EkoTRiqK9-XWAAAAAGDIKlNwZWFudXRuYnQ=",
                    credential: "e1dc3ad4-cd90-11eb-bd2d-0242ac140004",
                    urls: [
                        "turn:us-turn1.xirsys.com:80?transport=udp",
                        "turn:us-turn1.xirsys.com:80?transport=tcp",
                    ]
                }]
            });

            return peer;
        }
        //

        var client = new WebSocket("wss://localhost:8081/call", "echo-protocol");
        console.log("00000000000000000000000:", client)
        var candidate;
        var newPeer = createPeer();
        newPeer.oniceconnectionstatechange = (event) => {
            console.log("oniceconnectionstatechange111: ", newPeer.iceConnectionState)
        }

        client.onopen = async () => {
            console.log("okkkkkkkkkkkkkkkkkkkkkkkkkkkkkk")
            var localStream = media_stream;
            localStream
                .getTracks()
                .forEach((track) => {
                    console.log("track---------:", track)
                    console.log("localStream---------:", localStream)
                    newPeer.addTrack(track, localStream)
                });

            var offer = await newPeer.createOffer();
            newPeer.setLocalDescription(offer);
            console.log("------------------------MCU CONNECT SOCKET OK > START SENDING OFFER----------")
            setTimeout(() => {
                console.log("=============client==========: ", offer.sdp)
                client.send(
                    JSON.stringify({
                        id: "client",
                        sdpOffer: offer.sdp,
                    })
                );
            }, 2000);
            newPeer.onicecandidate = (e) => {
                candidate = e.candidate;
                console.log("----------e.candidate-----", e.candidate);
                client.send(
                    JSON.stringify({
                        id: "onIceCandidate",
                        candidate: candidate,
                    })
                );
            };

            const webSocketCallback = async (data) => {
                console.log("1111111111111111111111111111111111111111111111!: ", data)
                var val = JSON.parse(data);
                // console.log(val)
                let setSDP_OK = false
                if (val.id === "response" && val.response === "accepted") {
                    sessionId = val.sessionId
                    console.log("sessionId", sessionId)
                    var test = {
                        type: "answer",
                        sdp: val.sdpAnswer,
                    };
                    const desc = new RTCSessionDescription(test);
                    newPeer.setRemoteDescription(desc);
                    setSDP_OK = true

                    newPeer.ontrack = async (e) => {
                        if (count == 1) {
                            console.log("------------------ON TRACK IN BRIDGE MCU > START CALLING SFU--------------", e)

                            if (send_back_mcu_to_sfu) {
                                send_back_mcu_to_sfu = false
                                JitsiMeetJS.createLocalTracks({ devices: ['audio', 'video'] }, e)
                                    .then(onLocalTracks)
                                    .then(() => {
                                        //
                                        const video = document.createElement("video");
                                        video.id = `remote`;
                                        video.srcObject = newPeer.getRemoteStreams()[0];
                                        video.autoplay = true;
                                        video.style.border = "3px solid red";
                                        document.body.appendChild(video)
                                        console.log("okokokokoko: ", newPeer.iceConnectionState)
                                        console.log("okokokokoko1: ", newPeer.connectionState)
                                        //
                                    })
                                    .catch(error => {
                                        console.log("errrrrrRER: ", error)
                                        throw error;
                                    });

                            }

                        }
                    };
                }
                // console.log(val.id)
                if (val.id === "iceCandidate" && setSDP_OK) {
                    try {
                        var test = new RTCIceCandidate(val.candidate);
                        await newPeer.addIceCandidate(test);
                        resolve("abc")

                    } catch (err) {
                        console.log("11111", err);
                        reject(err)
                    }
                }
            };
            client.onmessage = (e) => webSocketCallback(e.data)
        };
    } catch (error) {
        console.log("error: ", error)
    }

});
const options = {
    hosts: {
        domain: 'jitsimeet.example.com',
        muc: 'conference.jitsimeet.example.com' // FIXME: use XEP-0030
    },
    bosh: 'https://jitsimeet.example.com/http-bind', // FIXME: use xep-0156 for that

    // The name of client node advertised in XEP-0115 'c' stanza
    clientNode: 'http://jitsi.org/jitsimeet'
};

const confOptions = {
};

let connection = null;
let isJoined = false;
let room = null;

let localTracks = [];
const remoteTracks = {};

/**
 * Handles local tracks.
 * @param tracks Array with JitsiTrack objects
 */
function onLocalTracks(tracks) {
    console.log("----------onLocalTracks111-------")
    localTracks = tracks;
    for (let i = 0; i < localTracks.length; i++) {
        localTracks[i].addEventListener(
            JitsiMeetJS.events.track.TRACK_AUDIO_LEVEL_CHANGED,
            audioLevel => console.log(`Audio Level local: ${audioLevel}`));
        localTracks[i].addEventListener(
            JitsiMeetJS.events.track.TRACK_MUTE_CHANGED,
            () => console.log('local track muted'));
        localTracks[i].addEventListener(
            JitsiMeetJS.events.track.LOCAL_TRACK_STOPPED,
            () => console.log('local track stoped'));
        localTracks[i].addEventListener(
            JitsiMeetJS.events.track.TRACK_AUDIO_OUTPUT_CHANGED,
            deviceId =>
                console.log(
                    `track audio output device was changed to ${deviceId}`));
        // if (localTracks[i].getType() === 'video') {
        //     $('body').append(`<video autoplay='1' id='localVideo${i}' />`);
        //     localTracks[i].attach($(`#localVideo${i}`)[0]);
        //     document.getElementById(`localVideo${i}`).style.border = "3px solid blue";

        // } else {
        //     $('body').append(
        //         `<audio autoplay='1' muted='true' id='localAudio${i}' />`);
        //     localTracks[i].attach($(`#localAudio${i}`)[0]);
        // }
        if (isJoined) {
            room.addTrack(localTracks[i]);
        }
    }
    return
}

/**
 * Handles remote tracks
 * @param track JitsiTrack object
 */
function onRemoteTrack(track) {
    if (track.isLocal()) {
        return;
    }
    try {
        // if(call_mcu){
        if (track.getType() == 'video') {
            mcu.main(track.stream);
        }
        //     call_mcu = false
        // }
    } catch (error) {
        console.log("eeeeeee: ", error)
    }
    // const participant = track.getParticipantId();

    // if (!remoteTracks[participant]) {
    //     remoteTracks[participant] = [];
    // }
    // const idx = remoteTracks[participant].push(track);

    // track.addEventListener(
    //     JitsiMeetJS.events.track.TRACK_AUDIO_LEVEL_CHANGED,
    //     audioLevel => console.log(`Audio Level remote: ${audioLevel}`));
    // track.addEventListener(
    //     JitsiMeetJS.events.track.TRACK_MUTE_CHANGED,
    //     () => console.log('remote track muted'));
    // track.addEventListener(
    //     JitsiMeetJS.events.track.LOCAL_TRACK_STOPPED,
    //     () => console.log('remote track stoped'));
    // track.addEventListener(JitsiMeetJS.events.track.TRACK_AUDIO_OUTPUT_CHANGED,
    //     deviceId =>
    //         console.log(
    //             `track audio output device was changed to ${deviceId}`));
    // const id = participant + track.getType() + idx;

    // if (track.getType() === 'video') {
    //     $('body').append(
    //         `<video autoplay='1' id='${participant}video${idx}' />`);
    // } else {
    //     $('body').append(
    //         `<audio autoplay='1' id='${participant}audio${idx}' />`);
    // }
    // track.attach($(`#${id}`)[0]);
}

/**
 * That function is executed when the conference is joined
 */
function onConferenceJoined() {
    console.log('conference joined!');
    isJoined = true;
    for (let i = 0; i < localTracks.length; i++) {
        room.addTrack(localTracks[i]);
    }
}

/**
 *
 * @param id
 */
function onUserLeft(id) {
    console.log('user left');
    if (!remoteTracks[id]) {
        return;
    }
    const tracks = remoteTracks[id];

    for (let i = 0; i < tracks.length; i++) {
        tracks[i].detach($(`#${id}${tracks[i].getType()}`));
    }
}

/**
 * That function is called when connection is established successfully
 */
function onConnectionSuccess() {
    room = connection.initJitsiConference('conference', confOptions);
    console.log("room: ", room)
    room.on(JitsiMeetJS.events.conference.TRACK_ADDED, onRemoteTrack);
    room.on(JitsiMeetJS.events.conference.TRACK_REMOVED, track => {
        console.log(`track removed!!!${track}`);
    });
    room.on(
        JitsiMeetJS.events.conference.CONFERENCE_JOINED,
        onConferenceJoined);
    room.on(JitsiMeetJS.events.conference.USER_JOINED, id => {
        console.log('user join');
        remoteTracks[id] = [];
    });
    room.on(JitsiMeetJS.events.conference.USER_LEFT, onUserLeft);
    room.on(JitsiMeetJS.events.conference.TRACK_MUTE_CHANGED, track => {
        console.log(`${track.getType()} - ${track.isMuted()}`);
    });
    room.on(
        JitsiMeetJS.events.conference.DISPLAY_NAME_CHANGED,
        (userID, displayName) => console.log(`${userID} - ${displayName}`));
    room.on(
        JitsiMeetJS.events.conference.TRACK_AUDIO_LEVEL_CHANGED,
        (userID, audioLevel) => console.log(`${userID} - ${audioLevel}`));
    room.on(
        JitsiMeetJS.events.conference.PHONE_NUMBER_CHANGED,
        () => console.log(`${room.getPhoneNumber()} - ${room.getPhonePin()}`));
    room.join();
}

/**
 * This function is called when the connection fail.
 */
function onConnectionFailed() {
    console.error('Connection Failed!');
}

/**
 * This function is called when the connection fail.
 */
function onDeviceListChanged(devices) {
    console.info('current devices', devices);
}

/**
 * This function is called when we disconnect.
 */
function disconnect() {
    console.log('disconnect!');
    connection.removeEventListener(
        JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED,
        onConnectionSuccess);
    connection.removeEventListener(
        JitsiMeetJS.events.connection.CONNECTION_FAILED,
        onConnectionFailed);
    connection.removeEventListener(
        JitsiMeetJS.events.connection.CONNECTION_DISCONNECTED,
        disconnect);
}

/**
 *
 */
function unload() {
    for (let i = 0; i < localTracks.length; i++) {
        localTracks[i].dispose();
    }
    room.leave();
    connection.disconnect();
}

let isVideo = true;

/**
 *
 */
function switchVideo() { // eslint-disable-line no-unused-vars
    isVideo = !isVideo;
    if (localTracks[1]) {
        localTracks[1].dispose();
        localTracks.pop();
    }
    JitsiMeetJS.createLocalTracks({
        devices: [isVideo ? 'video' : 'desktop']
    })
        .then(tracks => {
            localTracks.push(tracks[0]);
            localTracks[1].addEventListener(
                JitsiMeetJS.events.track.TRACK_MUTE_CHANGED,
                () => console.log('local track muted'));
            localTracks[1].addEventListener(
                JitsiMeetJS.events.track.LOCAL_TRACK_STOPPED,
                () => console.log('local track stoped'));
            localTracks[1].attach($('#localVideo1')[0]);
            room.addTrack(localTracks[1]);
        })
        .catch(error => console.log(error));
}

/**
 *
 * @param selected
 */
function changeAudioOutput(selected) { // eslint-disable-line no-unused-vars
    JitsiMeetJS.mediaDevices.setAudioOutputDevice(selected.value);
}

$(window).bind('beforeunload', unload);
$(window).bind('unload', unload);

// JitsiMeetJS.setLogLevel(JitsiMeetJS.logLevels.ERROR);
const initOptions = {
    disableAudioLevels: true
};

JitsiMeetJS.init(initOptions);

connection = new JitsiMeetJS.JitsiConnection(null, null, options);
console.log("connection: ", connection)
connection.addEventListener(
    JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED,
    onConnectionSuccess);
connection.addEventListener(
    JitsiMeetJS.events.connection.CONNECTION_FAILED,
    onConnectionFailed);
connection.addEventListener(
    JitsiMeetJS.events.connection.CONNECTION_DISCONNECTED,
    disconnect);

JitsiMeetJS.mediaDevices.addEventListener(
    JitsiMeetJS.events.mediaDevices.DEVICE_LIST_CHANGED,
    onDeviceListChanged);

connection.connect();

// JitsiMeetJS.createLocalTracks({ devices: [ 'audio', 'video' ] })
//     .then(onLocalTracks)
//     .catch(error => {
//         throw error;
//     });

if (JitsiMeetJS.mediaDevices.isDeviceChangeAvailable('output')) {
    JitsiMeetJS.mediaDevices.enumerateDevices(devices => {
        const audioOutputDevices
            = devices.filter(d => d.kind === 'audiooutput');

        if (audioOutputDevices.length > 1) {
            $('#audioOutputSelect').html(
                audioOutputDevices
                    .map(
                        d =>
                            `<option value="${d.deviceId}">${d.label}</option>`)
                    .join('\n'));

            $('#audioOutputSelectWrapper').show();
        }
    });
}
