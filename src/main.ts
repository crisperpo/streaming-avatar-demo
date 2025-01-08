import StreamingAvatar, {
  AvatarQuality,
  StreamingEvents,
} from "@heygen/streaming-avatar";

// DOM elements
const videoElement = document.getElementById("avatarVideo") as HTMLVideoElement;
const startButton = document.getElementById(
  "startSession"
) as HTMLButtonElement;
const endButton = document.getElementById("endSession") as HTMLButtonElement;
const speakButton = document.getElementById("speakButton") as HTMLButtonElement;
const userInput = document.getElementById("userInput") as HTMLInputElement;

let avatar: StreamingAvatar | null = null;
let sessionData: any = null;

function fetchAccessToken() {
  return fetch('http://localhost:3000/api/get-access-token', { method: 'GET' })
    .then((response) => {
      if (response.ok) {
        // Check if the response content-type is JSON
        if (response.headers.get('content-type')?.includes('application/json')) {
          return response.json(); // Parse the response as JSON
        } else {
          return response.text().then((text) => {
            throw new Error(`Unexpected response format: ${text}`);
          });
        }
      } else {
        throw new Error(`Failed to fetch token: ${response.status} ${response.statusText}`);
      }
    })
    .then((data) => {
      console.log('Token:', data.token);
      return data.token; // Return the token
    })
    .catch((error) => {
      console.error('Error fetching access token:', error.message);
      throw error; // Re-throw the error for further handling
    });
}


// Initialize streaming avatar session
async function initializeAvatarSession() {
  const token = await fetchAccessToken();
  avatar = new StreamingAvatar({ token });

  sessionData = await avatar.createStartAvatar({
    quality: AvatarQuality.High,
    avatarName: "default",
  });

  console.log("Session data:", sessionData);

  // Enable end button and disable start button
  endButton.disabled = false;
  startButton.disabled = true;

  avatar.on(StreamingEvents.STREAM_READY, handleStreamReady);
  avatar.on(StreamingEvents.STREAM_DISCONNECTED, handleStreamDisconnected);
}

// Handle when avatar stream is ready
function handleStreamReady(event: any) {
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
async function handleSpeak() {
  if (avatar && userInput.value) {
    await avatar.speak({
      text: userInput.value,
    });
    userInput.value = ""; // Clear input after speaking
  }
}

// Event listeners for buttons
startButton.addEventListener("click", initializeAvatarSession);
endButton.addEventListener("click", terminateAvatarSession);
speakButton.addEventListener("click", handleSpeak);
