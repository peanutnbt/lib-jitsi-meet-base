// let cisco = {}

// cisco.main = default_stream => {
//   var mcu = {}
//   var requestAuthID = 0
//   var requestStatusID = 1
//   var requestStreamSizeHintID = 2
//   var receiveParticipationStatusID
//   var receiveParticipantsPermissionsID

//   var localStream
//   var pc = null
//   var remoteStream
//   var turnReady
//   var jwt
//   var ws
//   var token
//   var startAfterJoin = true
//   var sentRelaySDP = false
//   var sentUDPSDP = false
//   var sentTCPSDP = false
//   var localDescription
//   var gotVideo = false
//   var firstVideo = true
//   var afterSharing = false
//   var insideSharing = false
//   var setRemoteSuccess = false
//   var rtpVideoReceiver2 = null
//   var screenSharing = false
//   var sharingSender = null

//   var hostUdpCandidates = []
//   var hostTcpCandidates = []
//   var relayCandidate = []

//   var pcConfig = {
//     iceServers: [
//       {
//         urls: [
//           'turn:171.244.173.130:3478?transport=udp',
//           'turn:171.244.173.130:3478?transport=tcp',
//           'turn:171.244.173.132:3478?transport=udp',
//           'turn:171.244.173.132:3478?transport=tcp',
//           'turn:171.244.173.131:3478?transport=udp',
//           'turn:171.244.173.131:3478?transport=tcp'
//         ],
//         username: 'webrtc',
//         credential: 'Viettel@2020'
//       }
//     ],
//     sdpSemantics: 'unified-plan',
//     extmapAllowMixed: true
//   }

//   axios({
//     method: 'POST',
//     url: 'https://localhost:5000/login',
//     data: {
//       username: 'vts_thutt36_05@vc.viettel.vn',
//       password: '12345678aQ!'
//     }
//   }).then(
//     res => {
//       if (res.data.statusCode == 200) {
//         jwt = res.data.jwt
//         start()
//         join()
//       } else if (res.data.statusCode == 401) {
//         console.log('Unauthorized')
//       }
//     },
//     error => {
//       console.log(error)
//     }
//   )

//   async function start () {
//     console.log('Requesting local stream')
//     try {
//       //   const stream = await navigator.mediaDevices.getUserMedia({
//       //     video: {
//       //       width: { max: 1920, ideal: 1920 },
//       //       height: { max: 1080, ideal: 1080 },
//       //       aspectRatio: { ideal: 1.77778 },
//       //       resizeMode: { ideal: ['crop-and-scale'] }
//       //     },
//       //     audio: true
//       //   })
//       console.log('-----Received local stream:', default_stream)
//       localStream = default_stream
//     } catch (e) {
//       alert(`getUserMedia() error: ${e}`)
//     }
//   }

//   function join () {
//     axios({
//       method: 'POST',
//       url: 'https://localhost:5000/join',
//       data: {
//         numericId: '210713121',
//         jwtAuthToken: jwt
//       }
//     }).then(
//       res => {
//         console.log('Token', res.data)
//         token = res.data
//         ws = new WebSocket('wss://meeting.vc.viettel.vn/websockify/')
//         ws.onopen = () => {
//           console.log('Websocket open')

//           const payload = {
//             data: {
//               jwt: token
//             },
//             'http-method': 'POST',
//             path: '/api/call/authentication',
//             requestId: requestAuthID
//           }

//           ws.send(JSON.stringify(payload))

//           if (startAfterJoin) {
//             const payload2 = {
//               data: {
//                 audioMuted: false,
//                 videoMuted: false
//               },
//               'http-method': 'POST',
//               path: '/api/call/status',
//               requestId: requestStatusID
//             }

//             ws.send(JSON.stringify(payload2))

//             startAfterJoin = false
//           }
//         }

//         ws.onclose = () => {
//           console.log('Websocket closed')
//         }

//         ws.onmessage = message => {
//           const data = JSON.parse(message.data)
//           if (data.path == '/api/call/participation/permissions') {
//             ws.send(
//               JSON.stringify({
//                 status: 200,
//                 requestId: data.requestId
//               })
//             )

//             if (!pc) {
//               createPeerConnection()
//             }
//           } else if (data.path == '/api/call/streams/advertisement') {
//             if (
//               data.data.streams[0].videoStreamIdentifier != '' &&
//               data.data.streams[0].layouts.includes('All equal')
//             ) {
//               ws.send(
//                 JSON.stringify({
//                   data: {
//                     streams: [
//                       {
//                         audio: true,
//                         backgroundColour: 'F2F4F5',
//                         height: 625,
//                         layout: 'All equal',
//                         no_go: [],
//                         purpose: 'Main',
//                         video: true,
//                         width: 1366
//                       }
//                     ]
//                   },
//                   'http-method': 'POST',
//                   path: '/api/call/streams/selection',
//                   requestId: 27
//                 })
//               )

//               gotVideo = true
//               ws.send(
//                 JSON.stringify({
//                   status: 200,
//                   requestId: data.requestId
//                 })
//               )
//             } else {
//               ws.send(
//                 JSON.stringify({
//                   data: {
//                     streams: [
//                       {
//                         audio: true,
//                         backgroundColour: 'F2F4F5',
//                         height: 625,
//                         layout: '',
//                         no_go: [],
//                         purpose: 'Main',
//                         video: false,
//                         width: 1366
//                       }
//                     ]
//                   },
//                   'http-method': 'POST',
//                   path: '/api/call/streams/selection',
//                   requestId: 34
//                 })
//               )
//               gotVideo = false
//               ws.send(
//                 JSON.stringify({
//                   status: 200,
//                   requestId: data.requestId
//                 })
//               )
//             }
//           } else if (data.path == '/api/call/streams/selection') {
//             if (screenSharing) {
//               ws.send(
//                 JSON.stringify({
//                   status: 200,
//                   requestId: data.requestId
//                 })
//               )
//             } else {
//               if (gotVideo) {
//                 ws.send(
//                   JSON.stringify({
//                     data: {
//                       streams: [
//                         {
//                           audio: true,
//                           backgroundColour: 'F2F4F5',
//                           height: 625,
//                           layout: 'All equal',
//                           no_go: [],
//                           purpose: 'Main',
//                           video: true,
//                           width: 1366
//                         }
//                       ]
//                     },
//                     'http-method': 'POST',
//                     path: '/api/call/streams/selection',
//                     requestId: 27
//                   })
//                 )
//                 ws.send(
//                   JSON.stringify({
//                     status: 200,
//                     requestId: data.requestId
//                   })
//                 )
//               } else {
//                 ws.send(
//                   JSON.stringify({
//                     data: {
//                       streams: [
//                         {
//                           audio: true,
//                           backgroundColour: 'F2F4F5',
//                           height: 625,
//                           layout: '',
//                           no_go: [],
//                           purpose: 'Main',
//                           video: false,
//                           width: 1366
//                         }
//                       ]
//                     },
//                     'http-method': 'POST',
//                     path: '/api/call/streams/selection',
//                     requestId: 34
//                   })
//                 )
//                 ws.send(
//                   JSON.stringify({
//                     status: 200,
//                     requestId: data.requestId
//                   })
//                 )
//               }
//             }
//           } else if (data.path == '/api/call/description/answer') {
//             console.log('Set Remote SDP')
//             if (!setRemoteSuccess) {
//               setRemoteSuccess = true
//               handleAnswer(data.data.SDP)
//             }

//             ws.send(
//               JSON.stringify({
//                 status: 200,
//                 requestId: data.requestId
//               })
//             )
//           } else if (
//             data.path &&
//             data.path.startsWith('/api/call/participants/')
//           ) {
//             if (screenSharing) {
//               ws.send(
//                 JSON.stringify({
//                   data: {
//                     streams: [
//                       {
//                         height: 625,
//                         no_go: [],
//                         purpose: 'Main',
//                         width: 1366
//                       }
//                     ]
//                   },
//                   'http-method': 'POST',
//                   path: '/api/call/streams/size_hint',
//                   requestId: 16
//                 })
//               )
//             }
//           } else if (data.status == '200' || data.status == '409') {
//           } else {
//             if (data.requestId) {
//               ws.send(
//                 JSON.stringify({
//                   status: 200,
//                   requestId: data.requestId
//                 })
//               )
//             }
//           }
//         }
//       },
//       error => {
//         console.log(error)
//       }
//     )
//   }

//   function createPeerConnection () {
//     const configuration = {}
//     pc = new RTCPeerConnection(pcConfig)

//     localStream.getTracks().forEach(track => {
//       pc.addTrack(track, localStream)
//       console.log('-----Cisco peer addTracklocal: ', track)
//     })

//     pc.addEventListener('icecandidate', e => onIceCandidate(pc, e))
//     pc.addEventListener('icegatheringstatechange', e => onIceGathering(pc, e))
//     pc.onnegotiationneeded = () => handleNegotiation()
//     pc.ontrack = e => {
//       gotRemoteStream(e)
//     }

//     var rtpAudioReceiver = pc.addTransceiver('audio', { direction: 'recvonly' })
//     var rtpVideoReceiver = pc.addTransceiver('video', { direction: 'recvonly' })

//     rtpVideoReceiver2 = pc.addTransceiver('video', { direction: 'recvonly' })
//   }

//   function onCreateSessionDescriptionError (error) {
//     console.log('errorr', error)
//     console.log(`Failed to create session description: ${error.toString()}`)
//   }

//   async function onCreateOfferSuccess (desc) {
//     console.log(`Offer from pc\n${desc.sdp}`);
//     localDescription = desc.sdp
//     setRemoteSuccess = false
//     var newDesc = null

//     localDescription = localDescription.replaceAll('42e01f', '42e032')
//     localDescription = localDescription.replaceAll('42001f', '420032')

//     var indices1 = getIndicesOf('a=ssrc:', localDescription, true)
//     var indices3 = getIndicesOf('a=ssrc-group', localDescription, true)
//     var indexOfMVideoPlus = getIndicesOf('m=video', localDescription)
//     var indexOfMAudioPlus = getIndicesOf('m=audio', localDescription)

//     if (indices1 && indices1.length != 0 && indices3 && indices3.length) {
//       var newSDP =
//         localDescription.slice(0, indices3[0]) +
//         localDescription.slice(indices1[0], indices1[4]) +
//         localDescription.slice(indexOfMAudioPlus[0], localDescription.length)
//       console.log('Offer newSDP: ')
//       localDescription = newSDP
//     }

//     newDesc = new RTCSessionDescription({
//       type: 'offer',
//       sdp: localDescription
//     })

//     console.log('pc setLocalDescription start: ', newDesc.sdp)
//     try {
//       await pc.setLocalDescription(newDesc)
//       console.log('setLocalDescription done')
//       onSetLocalSuccess()
//     } catch (e) {
//       console.log('setLocalDescription err: ', e)
//     }
//   }

//   function onSetLocalSuccess () {
//     console.log(`pc setLocalDescription complete`)

//     if (hostUdpCandidates) {
//       const payload = {
//         data: {
//           SDP: localDescription,
//           candidates: hostUdpCandidates,
//           isUnifiedPlan: true,
//           streams: [
//             {
//               audioStreamIdentifier: '0',
//               purpose: 'Main',
//               videoStreamIdentifier: '1'
//             }
//           ]
//         },
//         'http-method': 'POST',
//         path: '/api/call/description/offer',
//         requestId: 13
//       }
//       ws.send(JSON.stringify(payload))
//     }
//   }

//   function onSetRemoteSuccess (pc) {
//     setRemoteSuccess = true
//     console.log(`pc setRemoteDescription complete`)
//   }

//   async function onIceCandidate (pc, event) {
//     // console.log(`pc ICE candidate:\n${event.candidate ? event.candidate.candidate : '(null)'}`);

//     if (event.candidate) {
//       if (event.candidate.type == 'host' && event.candidate.protocol == 'udp') {
//         hostUdpCandidates.push({
//           candidate: event.candidate.candidate,
//           sdpMLineIndex: event.candidate.sdpMLineIndex,
//           sdpMid: event.candidate.sdpMid
//         })
//       } else if (
//         event.candidate.type == 'host' &&
//         event.candidate.protocol == 'tcp'
//       ) {
//         hostTcpCandidates.push({
//           candidate: event.candidate.candidate,
//           sdpMLineIndex: event.candidate.sdpMLineIndex,
//           sdpMid: event.candidate.sdpMid
//         })

//         if (!sentUDPSDP) {
//           const payload = {
//             data: {
//               SDP: localDescription,
//               candidates: hostUdpCandidates,
//               isUnifiedPlan: true,
//               streams: [
//                 {
//                   audioStreamIdentifier: '0',
//                   purpose: 'Main',
//                   videoStreamIdentifier: '1'
//                 }
//               ]
//             },
//             'http-method': 'POST',
//             path: '/api/call/description/offer',
//             requestId: 13
//           }
//           ws.send(JSON.stringify(payload))

//           sentUDPSDP = true
//         }
//       } else if (event.candidate.type == 'relay') {
//         if (!sentTCPSDP) {
//           const payload = {
//             data: {
//               candidates: hostTcpCandidates
//             },
//             'http-method': 'POST',
//             path: '/api/call/description/candidates',
//             requestId: 14
//           }
//           ws.send(JSON.stringify(payload))

//           sentTCPSDP = true
//         }

//         relayCandidate.push({
//           candidate: event.candidate.candidate,
//           sdpMLineIndex: event.candidate.sdpMLineIndex,
//           sdpMid: event.candidate.sdpMid
//         })
//         if (
//           relayCandidate.length ==
//           (pcConfig.iceServers[0].urls.length / 2) * 3
//         ) {
//           const payload = {
//             data: {
//               candidates: relayCandidate
//             },
//             'http-method': 'POST',
//             path: '/api/call/description/candidates',
//             requestId: 15
//           }
//           ws.send(JSON.stringify(payload))
//         }
//       }
//     }
//   }

//   function gotRemoteStream (e) {
//     if (firstVideo) {
//       // remoteVideo.srcObject = e.streams[0]
//       console.log('Received remote stream')

//       //   mcu.main(e.streams[0], pc)

//       firstVideo = false
//     }
//   }

//   function onIceGathering (pc, event) {
//     let connection = event.target
//     switch (connection.iceGatheringState) {
//       case 'gathering':
//         break
//       case 'complete':
//         ws.send(
//           JSON.stringify({
//             'http-method': 'POST',
//             path: '/api/call/description/ice_complete',
//             requestId: 36
//           })
//         )
//         break
//     }
//   }

//   async function handleAnswer (sdp) {
//     console.log('HandleAnswer Remote sdp')

//     const desc = new RTCSessionDescription({
//       type: 'answer',
//       sdp: sdp
//     })
//     try {
//       await pc.setRemoteDescription(desc)
//       onSetRemoteSuccess(pc)
//     } catch (e) {
//       console.log('handleAnswer err: ', e)
//     }
//   }

//   async function handleNegotiation () {
//     console.log('*** negotiating ***')
//     try {
//       console.log('pc createOffer start')
//       const offer = await pc.createOffer()
//       await onCreateOfferSuccess(offer)
//     } catch (e) {
//       onCreateSessionDescriptionError(e)
//     }
//   }

//   //support function
//   function getIndicesOf (searchStr, str, caseSensitive) {
//     var searchStrLen = searchStr.length
//     if (searchStrLen == 0) {
//       return []
//     }
//     var startIndex = 0,
//       index,
//       indices = []
//     if (!caseSensitive) {
//       str = str.toLowerCase()
//       searchStr = searchStr.toLowerCase()
//     }
//     while ((index = str.indexOf(searchStr, startIndex)) > -1) {
//       indices.push(index)
//       startIndex = index + searchStrLen
//     }
//     return indices
//   }
// }

//Kurento connection

// mcu.main = (media_stream, jitsiLocalPeer) =>
//   new Promise((resolve, reject) => {
//     try {
//       let count = 1
//       function createPeer () {
//         let peer = new RTCPeerConnection({
//           iceServers: [
//             {
//               urls: ['stun:meet-jit-si-turnrelay.jitsi.net:443']
//             }
//           ]
//         })
//         return peer
//       }
//       //
//       var client = new WebSocket('wss://localhost:8081/call', 'echo-protocol')
//       var candidate
//       var newPeer = createPeer()
//       client.onopen = async () => {
//         var localStream = media_stream
//         localStream.getTracks().forEach(track => {
//           newPeer.addTrack(track, localStream)
//         })

//         var offer = await newPeer.createOffer()
//         console.log('-------Kurento create offer-==: ')
//         newPeer.setLocalDescription(offer)
//         setTimeout(() => {
//           client.send(
//             JSON.stringify({
//               id: 'client',
//               sdpOffer: offer.sdp
//             })
//           )
//         }, 2000)
//         newPeer.onicecandidate = e => {
//           candidate = e.candidate
//           client.send(
//             JSON.stringify({
//               id: 'onIceCandidate',
//               candidate: candidate
//             })
//           )
//         }

//         const webSocketCallback = async data => {
//           var val = JSON.parse(data)
//           if (val.id === 'response' && val.response === 'accepted') {
//             var test = {
//               type: 'answer',
//               sdp: val.sdpAnswer
//             }
//             const desc = new RTCSessionDescription(test)
//             newPeer.setRemoteDescription(desc)

//             newPeer.ontrack = async e => {
//               if (count == 1) {
//                 if (e.track.kind == 'video') {
//                   localStream = e.streams[0]
//                   localStream.getTracks().forEach(track => {
//                     pc.addTrack(track, localStream)
//                   })
//                 }
//               }
//             }
//           }
//           if (val.id === 'iceCandidate') {
//             try {
//               var test = new RTCIceCandidate(val.candidate)
//               setTimeout(async () => {
//                 await newPeer.addIceCandidate(test)
//               }, 3000)
//               resolve('abc')
//             } catch (err) {
//               console.log('11111', err)
//               reject(err)
//             }
//           }
//         }
//         client.onmessage = e => webSocketCallback(e.data)
//       }
//     } catch (error) {
//       console.log('error: ', error)
//     }
//   })
/*------------------------------------------------------------------------------------------------------------*/

/*------------------------------------------------------------------------------------------------------------*/
/* global $, JitsiMeetJS */
let mcu = {}
let send_back_mcu_to_sfu = true

mcu.main = media_stream =>
  new Promise((resolve, reject) => {
    // console.log("---media_stream", media_stream.getTracks())

    try {
      let count = 1
      function createPeer () {
        let peer = new RTCPeerConnection({
          iceServers: [
            {
              urls: 'stun:meet-jit-si-turnrelay.jitsi.net:443'
            }
          ]
          //     urls: ["stun:us-turn1.xirsys.com"]
          // }, {
          //     username: "aeBvNoa7ckuGqJ79zRuW5VoDqlOjOlv40EdgmklPH0XdqjYr_i6-EkoTRiqK9-XWAAAAAGDIKlNwZWFudXRuYnQ=",
          //     credential: "e1dc3ad4-cd90-11eb-bd2d-0242ac140004",
          //     urls: [
          //         "turn:us-turn1.xirsys.com:80?transport=udp",
          //         "turn:us-turn1.xirsys.com:80?transport=tcp",
          //     ]
          // }]
        })

        return peer
      }
      //

      var client = new WebSocket('wss://localhost:8081/call', 'echo-protocol')
      // console.log("00000000000000000000000:", client)
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
        // console.log("okkkkkkkkkkkkkkkkkkkkkkkkkkkkkk")
        var localStream = media_stream
        localStream.getTracks().forEach(track => {
          // console.log("track---------:", track)
          // console.log("localStream---------:", localStream)
          newPeer.addTrack(track, localStream)
        })

        var offer = await newPeer.createOffer()
        newPeer.setLocalDescription(offer)
        console.log(
          '------------------------MCU CONNECT SOCKET OK > START SENDING OFFER----------'
        )
        setTimeout(() => {
          // console.log("=============client==========: ", offer.sdp)
          client.send(
            JSON.stringify({
              id: 'client',
              sdpOffer: offer.sdp
            })
          )
        }, 2000)
        newPeer.onicecandidate = e => {
          candidate = e.candidate
          // console.log("----------e.candidate-----", e.candidate);
          client.send(
            JSON.stringify({
              id: 'onIceCandidate',
              candidate: candidate
            })
          )
        }

        const webSocketCallback = async data => {
          // console.log("1111111111111111111111111111111111111111111111!: ", data)
          var val = JSON.parse(data)
          // console.log(val)
          // let setSDP_OK = false
          if (val.id === 'response' && val.response === 'accepted') {
            sessionId = val.sessionId
            console.log('sessionId', sessionId)
            var test = {
              type: 'answer',
              sdp: val.sdpAnswer
            }
            const desc = new RTCSessionDescription(test)
            newPeer.setRemoteDescription(desc)
            // console.log("kurento desc: ", desc)
            // setSDP_OK = true

            newPeer.ontrack = async e => {
              if (count == 1) {
                console.log(
                  '------------------ON TRACK IN BRIDGE MCU > START CALLING SFU--------------'
                )

                // cisco.main(e.streams[0])

                // set
                JitsiMeetJS.createLocalTracks(
                  { devices: ['audio', 'video'] },
                  e
                )
                  .then(onLocalTracks)
                  .then(() => {
                    //
                    // if (send_back_mcu_to_sfu) {
                    //     send_back_mcu_to_sfu = false
                    // const video = document.createElement('video')
                    // video.id = `remote`
                    // video.srcObject = newPeer.getRemoteStreams()[0]
                    // video.autoplay = true
                    // video.style.border = '3px solid red'
                    // document.body.appendChild(video)
                  })
                  .catch(error => {
                    console.log('errrrrrRER: ', error)
                    throw error
                  })
              }
            }
          }
          console.log('val.id: ', val.id)
          // if (val.id === "iceCandidate" && setSDP_OK) {
          if (val.id === 'iceCandidate') {
            try {
              var test = new RTCIceCandidate(val.candidate)
              console.log('kurento ice: ', test)
              setTimeout(async () => {
                await newPeer.addIceCandidate(test)
              }, 3000)
              // resolve("abc")
            } catch (err) {
              console.log('11111', err)
              // reject(err)
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

const confOptions = {}

let connection = null
let isJoined = false
let room = null

let localTracks = []
const remoteTracks = {}

/**
 * Handles local tracks.
 * @param tracks Array with JitsiTrack objects
 */
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
      console.log("room.addTrack:", localTracks[i])
      room.addTrack(localTracks[i])
    }
  }
  return
}

/**
 * Handles remote tracks
 * @param track JitsiTrack object
 */
function onRemoteTrack (track) {
  if (track.isLocal()) {
    return
  }
  try {
    // if(call_mcu){
    if (track.getType() == 'video') {
      mcu.main(track.stream)
    }
    //     call_mcu = false
    // }
  } catch (error) {
    console.log('eeeeeee: ', error)
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
function onConferenceJoined () {
  console.log('conference joined!')
  isJoined = true
  // for (let i = 0; i < localTracks.length; i++) {
  //   room.addTrack(localTracks[i])
  // }
}

/**
 *
 * @param id
 */
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

/**
 * That function is called when connection is established successfully
 */
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

/**
 * This function is called when the connection fail.
 */
function onConnectionFailed () {
  console.error('Connection Failed!')
}

/**
 * This function is called when the connection fail.
 */
function onDeviceListChanged (devices) {
  console.info('current devices', devices)
}

/**
 * This function is called when we disconnect.
 */
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

/**
 *
 */
function unload () {
  for (let i = 0; i < localTracks.length; i++) {
    localTracks[i].dispose()
  }
  room.leave()
  connection.disconnect()
}

let isVideo = true

/**
 *
 */
function switchVideo () {
  // eslint-disable-line no-unused-vars
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

/**
 *
 * @param selected
 */
function changeAudioOutput (selected) {
  // eslint-disable-line no-unused-vars
  JitsiMeetJS.mediaDevices.setAudioOutputDevice(selected.value)
}

$(window).bind('beforeunload', unload)
$(window).bind('unload', unload)

// JitsiMeetJS.setLogLevel(JitsiMeetJS.logLevels.ERROR);
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

// JitsiMeetJS.createLocalTracks({ devices: [ 'audio', 'video' ] })
//     .then(onLocalTracks)
//     .catch(error => {
//         throw error;
//     });

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
