let mcu = {}
let count_call_add_jitsi_local_track = 0

mcu.main = media_tracks =>
  new Promise((resolve, reject) => {
    try {
      function createPeer () {
        let peer = new RTCPeerConnection({
          iceServers: [
            {
              urls: 'stun:meet-jit-si-turnrelay.jitsi.net:443'
            }
          ]
        })

        return peer
      }

      var client = new WebSocket('wss://localhost:8081/call', 'echo-protocol')
      var candidate
      let newPeer = createPeer()
      newPeer.oniceconnectionstatechange = event => {
        console.log(
          'oniceconnectionstatechange111: ',
          newPeer.iceConnectionState
        )
      }
      newPeer.onconnectionstatechange = event => {
        console.log('connectionStateconnectionState: ', newPeer.connectionState)
      }

      client.onopen = async () => {
        console.log("okkkkkkkkkkkkkkkkkkkkkkkkkkkkkk: ", media_tracks)
        newPeer.addTrack(media_tracks[0].track, media_tracks[0].stream)
        newPeer.addTrack(media_tracks[1].track, media_tracks[1].stream)

        var offer = await newPeer.createOffer()
        newPeer.setLocalDescription(offer)
        console.log(
          '------------------------MCU CONNECT SOCKET OK > START SENDING OFFER----------'
        )
        setTimeout(() => {
          console.log("---KURENTO setLocalDescription-------: ", offer.sdp)

          client.send(
            JSON.stringify({
              id: 'client',
              sdpOffer: offer.sdp
            })
          )
        }, 2000)
        newPeer.onicecandidate = e => {
          candidate = e.candidate
          client.send(
            JSON.stringify({
              id: 'onIceCandidate',
              candidate: candidate
            })
          )
        }

        const webSocketCallback = async data => {
          var val = JSON.parse(data)
          if (val.id === 'response' && val.response === 'accepted') {
            sessionId = val.sessionId
            console.log('sessionId', sessionId)
            var test = {
              type: 'answer',
              sdp: val.sdpAnswer
            }
            const desc = new RTCSessionDescription(test)
            newPeer.setRemoteDescription(desc)
            console.log("---KURENTO setRemoteDescription-------: ", val.sdpAnswer)

            newPeer.ontrack = async e => {
              console.log("---KURENTO ONTRACK-------: ", e)
              // if (count_call_add_jitsi_local_track < 2) {
                console.log(
                  '------------------ON TRACK IN BRIDGE MCU > START CALLING SFU--------------'
                )
                JitsiMeetJS.createLocalTracks(
                  { devices: ['audio', 'video'] },
                  e
                )
                  .then(onLocalTracks)
                  .then(() => {
                    count_call_add_jitsi_local_track++
                  })
                  .catch(error => {
                    console.log('errrrrrRER: ', error)
                    throw error
                  })
              // }
            }
          }
          console.log('val.id: ', val.id)
          if (val.id === 'iceCandidate') {
            try {
              var test = new RTCIceCandidate(val.candidate)
              console.log('kurento ice: ', test)
              setTimeout(async () => {
                await newPeer.addIceCandidate(test)
              }, 3000)
            } catch (err) {
              console.log('11111', err)
            }
          }
        }
        client.onmessage = e => webSocketCallback(e.data)
      }
    } catch (error) {
      console.log('error: ', error)
    }
  })
const options = {
  hosts: {
    domain: 'jitsimeet.example.com',
    muc: 'conference.jitsimeet.example.com' // FIXME: use XEP-0030
  },
  bosh: 'https://jitsimeet.example.com/http-bind', // FIXME: use xep-0156 for that

  // The name of client node advertised in XEP-0115 'c' stanza
  clientNode: 'http://jitsi.org/jitsimeet'
}

const confOptions = {
}

let connection = null
let isJoined = false
let room = null

let localTracks = []
const remoteTracks = {}

function onLocalTracks (tracks) {
  console.log(
    '----------_setConference2-------: ',
    new Date().getTime(),
    tracks
  )
  localTracks = tracks
  for (let i = 0; i < localTracks.length; i++) {
    localTracks[i].addEventListener(
      JitsiMeetJS.events.track.TRACK_AUDIO_LEVEL_CHANGED,
      audioLevel => console.log(`Audio Level local: ${audioLevel}`)
    )
    localTracks[i].addEventListener(
      JitsiMeetJS.events.track.TRACK_MUTE_CHANGED,
      () => console.log('local track muted')
    )
    localTracks[i].addEventListener(
      JitsiMeetJS.events.track.LOCAL_TRACK_STOPPED,
      () => console.log('local track stoped')
    )
    localTracks[i].addEventListener(
      JitsiMeetJS.events.track.TRACK_AUDIO_OUTPUT_CHANGED,
      deviceId =>
        console.log(`track audio output device was changed to ${deviceId}`)
    )
    if (isJoined) {
      console.log("room.addTrack:", localTracks[i])
      room.addTrack(localTracks[i])
    }
  }
  return
}

let listTrackByEndpoint = new Map();

function onRemoteTrack (track) {
  if (track.isLocal()) {
    return
  }
  try {

      console.log("KURENTO JITSI listTrackByEndpoint.get(track.ownerEndpointId)  000: ", track, listTrackByEndpoint.get(track.ownerEndpointId))
      let newArrayTrack
      if(Array.isArray(listTrackByEndpoint.get(track.ownerEndpointId))){
        listTrackByEndpoint.get(track.ownerEndpointId).push(track)
        newArrayTrack = listTrackByEndpoint.get(track.ownerEndpointId)
      }
      else newArrayTrack = [track]
       
      listTrackByEndpoint.set(track.ownerEndpointId, newArrayTrack)

      console.log("KURENTO JITSI listTrackByEndpoint: ", listTrackByEndpoint, [track])
      console.log("KURENTO JITSI listTrackByEndpoint.get(track.ownerEndpointId): ", listTrackByEndpoint.get(track.ownerEndpointId))

      if(listTrackByEndpoint.get(track.ownerEndpointId)?.length == 2 ){
        mcu.main(listTrackByEndpoint.get(track.ownerEndpointId))
        listTrackByEndpoint.delete(track.ownerEndpointId)
      }

  } catch (error) {
    console.log('eeeeeee: ', error)
  }
}

function onConferenceJoined () {
  console.log('conference joined!')
  isJoined = true
}

function onUserLeft (id) {
  console.log('user left')
  if (!remoteTracks[id]) {
    return
  }
  const tracks = remoteTracks[id]

  for (let i = 0; i < tracks.length; i++) {
    tracks[i].detach($(`#${id}${tracks[i].getType()}`))
  }
}

function onConnectionSuccess () {
  room = connection.initJitsiConference('conference', confOptions)
  console.log('room: ', room)
  room.on(JitsiMeetJS.events.conference.TRACK_ADDED, onRemoteTrack)
  room.on(JitsiMeetJS.events.conference.TRACK_REMOVED, track => {
    console.log(`track removed!!!${track}`)
  })
  room.on(JitsiMeetJS.events.conference.CONFERENCE_JOINED, onConferenceJoined)
  room.on(JitsiMeetJS.events.conference.USER_JOINED, id => {
    console.log('user join')
    remoteTracks[id] = []
  })
  room.on(JitsiMeetJS.events.conference.USER_LEFT, onUserLeft)
  room.on(JitsiMeetJS.events.conference.TRACK_MUTE_CHANGED, track => {
    console.log(`${track.getType()} - ${track.isMuted()}`)
  })
  room.on(
    JitsiMeetJS.events.conference.DISPLAY_NAME_CHANGED,
    (userID, displayName) => console.log(`${userID} - ${displayName}`)
  )
  room.on(
    JitsiMeetJS.events.conference.TRACK_AUDIO_LEVEL_CHANGED,
    (userID, audioLevel) => console.log(`${userID} - ${audioLevel}`)
  )
  room.on(JitsiMeetJS.events.conference.PHONE_NUMBER_CHANGED, () =>
    console.log(`${room.getPhoneNumber()} - ${room.getPhonePin()}`)
  )
  room.join()
}

function onConnectionFailed () {
  console.error('Connection Failed!')
}

function onDeviceListChanged (devices) {
  console.info('current devices', devices)
}

function disconnect () {
  console.log('disconnect!')
  connection.removeEventListener(
    JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED,
    onConnectionSuccess
  )
  connection.removeEventListener(
    JitsiMeetJS.events.connection.CONNECTION_FAILED,
    onConnectionFailed
  )
  connection.removeEventListener(
    JitsiMeetJS.events.connection.CONNECTION_DISCONNECTED,
    disconnect
  )
}

function unload () {
  for (let i = 0; i < localTracks.length; i++) {
    localTracks[i].dispose()
  }
  room.leave()
  connection.disconnect()
}

let isVideo = true

function switchVideo () {
  isVideo = !isVideo
  if (localTracks[1]) {
    localTracks[1].dispose()
    localTracks.pop()
  }
  JitsiMeetJS.createLocalTracks({
    devices: [isVideo ? 'video' : 'desktop']
  })
    .then(tracks => {
      localTracks.push(tracks[0])
      localTracks[1].addEventListener(
        JitsiMeetJS.events.track.TRACK_MUTE_CHANGED,
        () => console.log('local track muted')
      )
      localTracks[1].addEventListener(
        JitsiMeetJS.events.track.LOCAL_TRACK_STOPPED,
        () => console.log('local track stoped')
      )
      localTracks[1].attach($('#localVideo1')[0])
      room.addTrack(localTracks[1])
    })
    .catch(error => console.log(error))
}

function changeAudioOutput (selected) {
  // eslint-disable-line no-unused-vars
  JitsiMeetJS.mediaDevices.setAudioOutputDevice(selected.value)
}

const initOptions = {
  disableAudioLevels: true
}

JitsiMeetJS.init(initOptions)

connection = new JitsiMeetJS.JitsiConnection(null, null, options)
console.log('connection: ', connection)
connection.addEventListener(
  JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED,
  onConnectionSuccess
)
connection.addEventListener(
  JitsiMeetJS.events.connection.CONNECTION_FAILED,
  onConnectionFailed
)
connection.addEventListener(
  JitsiMeetJS.events.connection.CONNECTION_DISCONNECTED,
  disconnect
)

JitsiMeetJS.mediaDevices.addEventListener(
  JitsiMeetJS.events.mediaDevices.DEVICE_LIST_CHANGED,
  onDeviceListChanged
)

connection.connect()

if (JitsiMeetJS.mediaDevices.isDeviceChangeAvailable('output')) {
  JitsiMeetJS.mediaDevices.enumerateDevices(devices => {
    const audioOutputDevices = devices.filter(d => d.kind === 'audiooutput')

    if (audioOutputDevices.length > 1) {
      $('#audioOutputSelect').html(
        audioOutputDevices
          .map(d => `<option value="${d.deviceId}">${d.label}</option>`)
          .join('\n')
      )
      $('#audioOutputSelectWrapper').show()
    }
  })
}
