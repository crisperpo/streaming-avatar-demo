import StreamingAvatar, {
  AvatarQuality,
  StreamingEvents,
  TaskType,
} from "@heygen/streaming-avatar";
import { AudioRecorder } from './lib/audioHandler';
import { fetchAccessToken } from "./service/heygen";
import { OpenAIAssistant } from "./service/openai";

// DOM elements
const videoElement = document.getElementById("avatarVideo") as HTMLVideoElement;
const startButton = document.getElementById(
  "startSession"
) as HTMLButtonElement;
const endButton = document.getElementById("endSession") as HTMLButtonElement;
const speakButton = document.getElementById("speakButton") as HTMLButtonElement;
const userInput = document.getElementById("userInput") as HTMLInputElement;
const recordButton = document.getElementById("recordButton") as HTMLButtonElement;
const recordingStatus = document.getElementById("recordingStatus") as HTMLParagraphElement;
const promptInput = document.getElementById("promptInput") as HTMLInputElement;
const voiceStatus = document.getElementById("voiceStatus") as HTMLElement;

const websocketInput = document.getElementById("websocketInput") as HTMLInputElement;
const websocketButton = document.getElementById("websocketButton") as HTMLButtonElement;
const websocketMessage = document.getElementById("websocketMessage") as HTMLParagraphElement;

let avatar: StreamingAvatar | null = null;
let sessionData: any = null;
let openaiAssistant: OpenAIAssistant | null = null;
let audioRecorder: AudioRecorder | null = null;
let isRecording = false;

// Initialize streaming avatar session
async function initializeAvatarSession() {
  // Disable start button immediately to prevent double clicks
  startButton.disabled = true;
  try {
    const token = await fetchAccessToken();
    avatar = new StreamingAvatar({ token });

    // Initialize OpenAI Assistant
    const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;
    openaiAssistant = new OpenAIAssistant(openaiApiKey);
    await openaiAssistant.initialize(promptInput.value && promptInput.value);

    sessionData = await avatar.createStartAvatar({
      quality: AvatarQuality.Medium,
      avatarName: "default",
      language: "en",
    });
    console.log("Session data:", sessionData);

    // Enable end button and disable start button
    endButton.disabled = false;
    startButton.disabled = true;

    // Add voice chat event listeners
    avatar.on(StreamingEvents.STREAM_READY, handleStreamReady);
    avatar.on(StreamingEvents.STREAM_DISCONNECTED, handleStreamDisconnected);
    avatar.on(StreamingEvents.USER_START, () => {
      voiceStatus.textContent = "Listening...";
    });
    avatar.on(StreamingEvents.USER_STOP, () => {
      voiceStatus.textContent = "Processing...";
    });
    avatar.on(StreamingEvents.AVATAR_START_TALKING, () => {
      voiceStatus.textContent = "Avatar is speaking...";
    });
    avatar.on(StreamingEvents.AVATAR_STOP_TALKING, () => {
      voiceStatus.textContent = "Waiting for you to speak...";
    });

  } catch (error) {
    console.error("Failed to initialize avatar session:", error);
    // Re-enable start button if initialization fails
    startButton.disabled = false;
  }
}

// async function startVoiceChat() {
//   if (!avatar) return;

//   try {
//     await avatar.startVoiceChat({
//       useSilencePrompt: false
//     });
//     voiceStatus.textContent = "Waiting for you to speak...";
//   } catch (error) {
//     console.error("Error starting voice chat:", error);
//     voiceStatus.textContent = "Error starting voice chat";
//   }
// }

// Handle when avatar stream is ready
async function handleStreamReady(event: any) {
  if (event.detail && videoElement) {
    videoElement.srcObject = event.detail;
    videoElement.onloadedmetadata = () => {
      videoElement.play().catch(console.error);
    };
  } else {
    console.error("Stream is not available");
  }
}

// Handle stream disconnection
function handleStreamDisconnected() {
  console.log("Stream disconnected");
  if (videoElement) {
    videoElement.srcObject = null;
  }

  // Enable start button and disable end button
  startButton.disabled = false;
  endButton.disabled = true;
}

// End the avatar session
async function terminateAvatarSession() {
  if (!avatar || !sessionData) return;

  await avatar.stopAvatar();
  videoElement.srcObject = null;
  avatar = null;
}

// Handle speaking event
async function handleSpeak(textToSpeakOut: string) {
  if (avatar && openaiAssistant && textToSpeakOut) {
    try {
      const response = await openaiAssistant.getResponse(textToSpeakOut);
      console.log("!!Assistant response:", response);
      await avatar.speak({
        text: response,
        taskType: TaskType.REPEAT,
      });
    } catch (error) {
      console.error("Error getting response:", error);
    }
    userInput.value = ""; // Clear input after speaking
  }
}

// Audio recording functions
function handleStatusChange(status: string) {
  console.log('Audio Status:', status);
};

function handleTranscriptionComplete(transcriptText: string) {
  handleSpeak(transcriptText);
}

async function toggleRecording() {
  if (!audioRecorder) {
    console.log('Creating new AudioRecorder instance');
    audioRecorder = new AudioRecorder(handleStatusChange, handleTranscriptionComplete);
  }

  if (!isRecording) {
    recordButton.textContent = "Stop Recording";
    await audioRecorder?.startRecording();
    isRecording = true;
  } else {
    recordButton.textContent = "Start Recording";
    audioRecorder?.stopRecording();
    isRecording = false;
  }
}

async function sendMessageToWebSocket() {
  if (!socket) return;

  const message = websocketInput.value;
  if (!message) return;

  socket.send(JSON.stringify({ message }));
  websocketInput.value = "";
}

// Event listeners for buttons
startButton.addEventListener("click", initializeAvatarSession);
endButton.addEventListener("click", terminateAvatarSession);
speakButton.addEventListener("click", () => handleSpeak(userInput.value));
recordButton.addEventListener("click", toggleRecording);
websocketButton.addEventListener("click", sendMessageToWebSocket);


// OpenAI WebSocket
const socket = new WebSocket('http://localhost:3000');

// When the connection is open
socket.addEventListener('open', () => {
  console.log('Connected to WebSocket server');
  socket.send(JSON.stringify({ message: 'Hello from the client!' }));
});

// Listen for messages from the server
socket.addEventListener('message', (event) => {
  console.log('Message from server:', JSON.parse(event.data));
  websocketMessage.textContent = JSON.parse(event.data).message;
});

// Handle connection close
socket.addEventListener('close', () => {
  console.log('WebSocket connection closed');
});

// Handle errors
socket.addEventListener('error', (error) => {
  console.error('WebSocket error:', error);
});