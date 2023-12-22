import { Tiktoken } from "js-tiktoken";
import { CreateChatCompletionRequestMessage } from "openai/resources/chat";
import { Message, Source } from "../types/chat";
import type { Session } from "../types/session";
import { SAMPLE_REPOS } from "../data/constants";

export const checkRepoAuthorization = async (
  repository: string,
  session: Session | null,
) => {
  const token = session?.user?.token;
  const domainRegex =
    /^(?:https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w\.-]*)*\/?$/;
  const domainMatch = repository.match(domainRegex);

  if (domainMatch) {
    return ["docs.nordicsemi.com", "st.com"].includes(repository) ? 200 : 404;
  }

  const statusCode = await fetch(`https://api.github.com/repos/${repository}`, {
    headers: token
      ? {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token
        }
      : {
          "Content-Type": "application/json",
        },
  })
    .then(
      // if authorized, the response will be 200
      (res) => {
        // Auth: got response from github
        if (!res.ok) {
          // Auth: res was not ok
          console.log(
            `Auth: ${res.status} ${res.statusText} for ${repository} with ${token}`,
          );
          throw new Error("could not access repo");
        }
        // Auth: res was ok
        return res.json();
      },
    )
    .then((json) => {
      // allow sample repos to be accessed by anyone
      if (SAMPLE_REPOS.some((sampleRepo) => sampleRepo.repo === repository)) {
        // Auth: public repo
        console.log(`Auth: ${repository} is public`);
        return 200;
      }

      // check if the repo is private
      if (
        json["visibility"] !== "public" &&
        session?.user?.membership !== "pro"
      ) {
        // console.log("visibility", json['visibility']);
        // console.log("membership", session?.user?.membership);

        console.log(`Auth: ${repository} is private and user is on free plan`);
        return 402;
      }

      // check if the repo is too large
      if (json["size"] > 10000 && session?.user?.membership !== "pro") {
        console.log(
          `Auth: ${repository} is too large and user is on free plan`,
        );
        return 426;
      }

      // Auth: user is authorized
      return 200;
    })
    .catch(
      // if unauthorized, the response will be 404
      (err) => {
        console.log(`Auth: ${err}`);
        return 404;
      },
    );

  console.log(
    // `User ${session?.user?.email} ${
    //   statusCode === 200 ? "is" : "is not"
    // } authorized to access ${repository}.`,
    `User ${
      statusCode === 200 ? "is" : "is not"
    } authorized to access ${repository}.`
  );
  return statusCode;
};

export const getDefaultBranch = async (repo: string, token: string) => {
  // console.log("get branch:", repo, token);
  return await fetcher(`https://api.github.com/repos/${repo}`, {
    headers: token
      ? {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token
        }
      : {
          "Content-Type": "application/json",
        },
  })
    .then((json) => json.default_branch)
    .catch((err) => {
      throw new Error(err);
    });
};

export const getLatestCommit = async (
  repo: string,
  branch: string,
  token: string | undefined,
) => {
  return await fetcher(
    `https://api.github.com/repos/${repo}/commits/${branch}`,
    {
      headers: token
        ? {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token
          }
        : {
            "Content-Type": "application/json",
          },
    },
  )
    .then((data) => data.sha)
    .catch(() => undefined);
};

export const parseIdentifier = (input: string): string | null => {
  if (/^[a-zA-Z0-9\._-]+\/[a-zA-Z0-9\._-]+$/.test(input)) return input;
  const regex =
    /(?:https?:\/\/(?:www\.)?github\.com\/|git@github\.com:)([a-zA-Z0-9\._-]+\/[a-zA-Z0-9\._-]+)/;
  const match = input.match(regex);

  // exclude .git if it's at the end of the string
  if (match && match[1].endsWith(".git")) {
    return match[1].slice(0, -4);
  }
  if (match) return match[1];

  const domainRegex =
    /^(?:https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w\.-]*)*\/?$/;
  const domainMatch = input.match(domainRegex);

  if (domainMatch) return domainMatch[1] + "." + domainMatch[2];
  return null;
};

// bad helper for now, hopefully will lead to cleaner solution when we abstract away identifer
export function isDomain(input: string): boolean {
  const domainRegex =
    /^(?:https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w\.-]*)*\/?$/;
  const domainMatch = input.match(domainRegex);
  return domainMatch ? true : false;
}

export async function fetcher<JSON = any>(
  input: RequestInfo,
  init?: RequestInit,
): Promise<JSON> {
  const res = await fetch(input, init);
  if (!res.ok) {
    const json = await res.json();
    if (json.error) {
      const error = new Error(json.error) as Error & {
        status: number;
      };
      error.status = res.status;
      throw error;
    } else {
      throw new Error("An unexpected error occurred");
    }
  }

  return res.json();
}

export function formatDate(input: string | number | Date): string {
  const date = new Date(input);
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function countTokensInMessages(
  messages: CreateChatCompletionRequestMessage[],
  encoder: Tiktoken,
) {
  // export function countTokensInMessages(messages: ChatCompletionRequestMessage[]) {
  // just return the number of characters for now
  // Temporary soln until we can get the encoder working
  // return JSON.stringify(messages).length / 3;

  let counter = 0;
  messages.forEach((message) => {
    counter += 4;
    for (const key of Object.keys(message)) {
      if (key === "name") counter -= 1;
    }
    for (const value of Object.values(message)) {
      counter += encoder.encode(String(value)).length;
    }
  });
  counter += 2;
  return counter;
}

// export function cleanTextForGPT(text: string): string {
//   // return text.replaceAll("<|endoftext|>", "< | end of text | >");
//   return text.replaceAll(
//     "<|endoftext|>",
//     "<\u200B|\u200Bend\u200Bof\u200Btext\u200B|\u200B>",
//   );
// }

export function cleanMessage(message: Message): Message {
  const contentChunks: string[] = [];
  const sources: Source[] = [];
  let agentStatus = "";
  const segments = message.content.split("\n");
  for (const segment of segments) {

    let type = "";
    let message: any = "";
    try {
      const parsedSegment = JSON.parse(segment);
      type = parsedSegment.type;
      message = parsedSegment.message;
    } catch (e) {
      // can't parse as JSON, so it's probably a string
      contentChunks.push(segment);
      continue;
    }

    // At this point, we have a JSON message
    if (type === "status") {
      agentStatus = message;
    } else if (type === "sources") {
      sources.push(message);
    } else if (type === "message") {
      contentChunks.push(message);
    }
  }

  return {
    ...message,
    content: contentChunks.join(""),
    agentStatus: agentStatus.length > 0 ? agentStatus : undefined,
    sources: sources.length > 0 ? sources.flat() : undefined,
  };
}
