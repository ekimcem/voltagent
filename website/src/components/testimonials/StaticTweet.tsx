import type { Tweet } from "react-tweet/api";
import { MagicTweet, TweetNotFound } from "../magicui/tweet-card";

interface StaticTweetProps {
  tweet: Tweet | null;
  className?: string;
}

export function StaticTweet({ tweet, className }: StaticTweetProps) {
  if (!tweet) {
    return <TweetNotFound />;
  }

  return <MagicTweet tweet={tweet} className={className} />;
}
