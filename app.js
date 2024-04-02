// app.js

// 시그널링 서버에 연결
const socket = io('http://localhost:3000');

const startSharingButton = document.getElementById('startSharing');
const localVideo = document.getElementById('localVideo');

// RTCPeerConnection 객체 생성
const peerConnection = new RTCPeerConnection({
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] // STUN 서버 설정 예시
});


// 사용자의 미디어를 가져오고, 오퍼를 생성하여 전송하는 함수
function startSharing() {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
        // 로컬 비디오 태그에 스트림을 연결
        localVideo.srcObject = stream;

        // 스트림의 트랙을 RTCPeerConnection 객체에 추가
        stream.getTracks().forEach(track => {
            peerConnection.addTrack(track, stream);
        });

        // 오퍼 생성 및 전송
        createAndSendOffer();
    }).catch(error => console.error('미디어를 가져오는 데 실패했습니다:', error));
}

// "캠 공유 시작" 버튼 클릭 이벤트 리스너 등록
startSharingButton.addEventListener('click', startSharing);


// 오퍼 생성 및 전송 로직 (보통 이 코드는 특정 사용자 액션(예: "캠 공유 시작" 버튼 클릭)에 의해 트리거 됩니다)
function createAndSendOffer() {
  peerConnection.createOffer().then(offer => {
    peerConnection.setLocalDescription(offer);
    // 시그널링 서버를 통해 오퍼를 다른 피어에게 전송
    socket.emit('offer', offer);
  }).catch(error => console.error('Offer 생성 실패:', error));
}

// 오퍼 메시지 수신 로직
socket.on('offer', offer => {
  peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
  peerConnection.createAnswer().then(answer => {
    peerConnection.setLocalDescription(answer);
    // 시그널링 서버를 통해 앤서를 전송
    socket.emit('answer', answer);
  }).catch(error => console.error('Answer 생성 실패:', error));
});

// 앤서 메시지 수신 로직
socket.on('answer', answer => {
  peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
});

// ICE 후보 수집 및 전송
peerConnection.onicecandidate = event => {
  if (event.candidate) {
    socket.emit('candidate', event.candidate);
  }
};

// ICE 후보 메시지 수신
socket.on('candidate', candidate => {
  peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
});
