import { tryCatch } from "../lib/lib.ts";

const Url = "http://localhost:3000";
const LIKE_ICON = "/assets/heart.svg";

const requestLocks = new Set<string>();

function toggleButtonState(
  button: HTMLButtonElement,
  buttonIcon: HTMLDivElement,
  likeCountSpan: HTMLElement,
  currentlyLiked: boolean,
  currentNumericCount: number
) {
  const newLikeCount = currentlyLiked
    ? Math.max(0, currentNumericCount - 1)
    : currentNumericCount + 1;
  button.dataset.liked = currentlyLiked ? "false" : "true";
  buttonIcon.classList.toggle("text-pink-600");
  likeCountSpan.textContent = newLikeCount.toString();
}

export async function handleLikeToggle(event: MouseEvent) {
  const button = event.currentTarget as HTMLButtonElement;
  const postId = button.dataset.postId;
  const currentlyLiked = button.dataset.liked === "true";

  const likeIcon = button.querySelector("div[data-icon]");

  const postCard = button.closest("div[data-post-id]");

  const likeCountSpan = postCard?.querySelector(
    ".like-count-display"
  ) as HTMLElement | null;

  if (!postId || !likeIcon || !postCard || !likeCountSpan) {
    console.error(
      "Could not find post ID, button image, post card, or like count element for like toggle."
    );
    return;
  }

  if (requestLocks.has(postId)) {
    console.warn(`Request for postId ${postId} is already in progress.`);
    return;
  }

  requestLocks.add(postId);
  const currentNumericCount = parseInt(likeCountSpan.textContent || "0");
  toggleButtonState(
    button,
    likeIcon as HTMLDivElement,
    likeCountSpan,
    currentlyLiked,
    currentNumericCount
  );

  const { data: response, error: fetchError } = await tryCatch(
    fetch(`${Url}/likes/${postId}`, {
      method: currentlyLiked ? "DELETE" : "POST",
    })
  );

  requestLocks.delete(postId);
}
