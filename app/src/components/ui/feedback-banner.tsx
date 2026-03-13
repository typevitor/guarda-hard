type FeedbackType = "success" | "error";

type FeedbackBannerProps = {
  type: FeedbackType;
  message: string;
};

export function FeedbackBanner({ type, message }: FeedbackBannerProps) {
  if (type === "error") {
    return (
      <p role="alert" className="feedback-banner feedback-error">
        {message}
      </p>
    );
  }

  return (
    <p role="status" className="feedback-banner feedback-success">
      {message}
    </p>
  );
}
