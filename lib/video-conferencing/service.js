/**
 * Video Conferencing Service
 * Handles multi-party video calls with recording capabilities
 */

// WebRTC peer connection management
export class VideoConference {
  constructor(roomId, userId) {
    this.roomId = roomId;
    this.userId = userId;
    this.localStream = null;
    this.remoteStreams = new Map();
    this.peerConnections = new Map();
    this.isRecording = false;
    this.mediaRecorder = null;
  }

  async startLocalVideo() {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: { echoCancellation: true, noiseSuppression: true }
      });
      
      return this.localStream;
    } catch (error) {
      console.error('Failed to start local video:', error);
      throw error;
    }
  }

  async joinRoom(onRemoteStream, onParticipantJoined, onParticipantLeft) {
    // TODO: Implement signaling server connection
    // This would typically connect to a WebSocket server for signaling
    console.log(`Joining room ${this.roomId} as user ${this.userId}`);
    
    // Simulate peer connections
    this.onRemoteStream = onRemoteStream;
    this.onParticipantJoined = onParticipantJoined;
    this.onParticipantLeft = onParticipantLeft;
  }

  async addParticipant(participantId) {
    const peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        // TODO: Add TURN servers for production
      ]
    });

    // Add local stream tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, this.localStream);
      });
    }

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      const [remoteStream] = event.streams;
      this.remoteStreams.set(participantId, remoteStream);
      if (this.onRemoteStream) {
        this.onRemoteStream(participantId, remoteStream);
      }
    };

    this.peerConnections.set(participantId, peerConnection);
    
    if (this.onParticipantJoined) {
      this.onParticipantJoined(participantId);
    }
  }

  async startRecording() {
    if (!this.localStream) {
      throw new Error('Local stream not available');
    }

    try {
      // Create a mixed stream for recording
      const mixedStream = new MediaStream();
      
      // Add local video track
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        mixedStream.addTrack(videoTrack);
      }

      // TODO: Mix audio from all participants
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        mixedStream.addTrack(audioTrack);
      }

      this.mediaRecorder = new MediaRecorder(mixedStream, {
        mimeType: 'video/webm;codecs=vp9'
      });

      const recordedChunks = [];
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        const recordedBlob = new Blob(recordedChunks, {
          type: 'video/webm'
        });
        
        // TODO: Save recording to storage
        this.saveRecording(recordedBlob);
      };

      this.mediaRecorder.start();
      this.isRecording = true;
      
      console.log('Started recording conference');
    } catch (error) {
      console.error('Failed to start recording:', error);
      throw error;
    }
  }

  stopRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
    }
  }

  async saveRecording(recordedBlob) {
    const recordingFile = new File([recordedBlob], `conference_${this.roomId}_${Date.now()}.webm`, {
      type: 'video/webm',
      lastModified: Date.now()
    });

    // TODO: Upload to Firebase Storage
    console.log('Conference recording saved:', recordingFile);
  }

  toggleMute() {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        return !audioTrack.enabled; // Return muted state
      }
    }
    return false;
  }

  toggleVideo() {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        return !videoTrack.enabled; // Return video off state
      }
    }
    return false;
  }

  leaveRoom() {
    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
    }

    // Close all peer connections
    this.peerConnections.forEach(pc => pc.close());
    this.peerConnections.clear();
    this.remoteStreams.clear();

    // Stop recording if active
    if (this.isRecording) {
      this.stopRecording();
    }

    console.log('Left conference room');
  }
}

// Screen sharing functionality
export async function startScreenShare() {
  try {
    const screenStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: true
    });
    
    return screenStream;
  } catch (error) {
    console.error('Failed to start screen sharing:', error);
    throw error;
  }
}