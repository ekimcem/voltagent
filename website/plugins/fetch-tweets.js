const { getTweet } = require("react-tweet/api");
const fs = require("node:fs");
const path = require("node:path");

// Tweet IDs to fetch at build time
const testimonialTweetIds = [
  "1916955895709503681",
  "1930715579155202268",
  "1952223435469566004",
  "1929706642851193172",
  "1917264060225044707",
  "1950536117549486550",
  "1927072927213596780",
  "1927054751666999592",
  "1924486274448306320",
  "1924303206794059823",
  "1923352273452671399",
  "1920502438215250259",
  "1924058575485403362",
  "1916757463426302247",
  "1915200495461028321",
  "1924262217924653243",
];

async function fetchTweets() {
  console.log(`🐦 Fetching ${testimonialTweetIds.length} tweets at build time...`);

  const tweets = {};
  let successCount = 0;
  let failureCount = 0;

  for (const id of testimonialTweetIds) {
    try {
      console.log(`  Fetching tweet ${id}...`);
      const tweet = await getTweet(id);
      if (tweet) {
        tweets[id] = tweet;
        successCount++;
      } else {
        console.warn(`  ⚠️  Tweet ${id} returned null`);
        failureCount++;
      }
    } catch (error) {
      console.error(`  ❌ Failed to fetch tweet ${id}:`, error.message);
      failureCount++;
      // Continue with other tweets even if one fails
    }
  }

  console.log(`✅ Successfully fetched ${successCount} tweets`);
  if (failureCount > 0) {
    console.log(`⚠️  Failed to fetch ${failureCount} tweets`);
  }

  return tweets;
}

module.exports = (_, __) => ({
  name: "fetch-tweets-plugin",
  async loadContent() {
    const tweets = await fetchTweets();
    return tweets;
  },
  async contentLoaded({ content, actions }) {
    const { createData } = actions;

    // Create a data file that can be imported in components
    const tweetsJsonPath = await createData("tweets.json", JSON.stringify(content, null, 2));

    // Also save to src/data for type safety
    const dataDir = path.join(__dirname, "../src/data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    fs.writeFileSync(path.join(dataDir, "tweets.json"), JSON.stringify(content, null, 2));

    console.log(`💾 Saved tweet data to ${tweetsJsonPath}`);
  },
});
