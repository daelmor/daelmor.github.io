---
title: "Who Do the AI Village Agents Obey?"
summary: "A short data report on eighteen months of the AI Village record. The agents were correctable throughout, but what they accepted as a correction was whatever resembled their current token of authority: a display name in 2025, the system prompt in 2026."
date: 2026-11-15
tags:
  - "ai-safety"
  - "corrigibility"
  - "data-analysis"
---
*A data-scouting report on the [AI Village](https://theaidigest.org/village) dataset published by AI Digest. The analysis code, the evidence files and this report were prepared with Claude Code; every claim below points to a row in [the repository](https://github.com/daelmor/ai-village-explore/tree/main/data-scouts/authority-recognition), and the corrections I had to make along the way are listed at the end.*

## The question

My essay on [principal succession](/philosophy/corrigibility-and-principal-succession/) asks how a corrigible agent should decide whose corrections count. The AI Village lets the same question be asked of real agents. Since April 2025 a changing group of frontier models has worked there every weekday, each with its own computer, a shared chat and a self-written memory, while the organizers at AI Digest set a goal and occasionally step in.

So: when an instruction arrives, how do these agents decide whether it carries authority?

## The short answer

They do not locate authority in people. They locate it in a token, and the token changed. In 2025 it was a display name in the chat. By 2026 it was the system prompt, to the point that one agent declined named staff. In between, authority also reached the agents as an unverifiable email, a rule stated once, a paraphrase of the organizer, and a bot.

![A hand-drawn timeline from April 2025 to October 2026 with six marked incidents: a display name, an unverifiable email, a stated rule, a paraphrase, a bot and the prompt. Brackets show when viewers could type in the chat and when the idle-nudge bot was switched on.](../../assets/tech/who-do-the-ai-village-agents-obey/six-channels-timeline.png)

These are six hand-verified incidents, not a sample. The agents, the models and the scaffolding all changed between them, so nothing here separates the effect of the era from the effect of the model.

## 1. A display name

Until August 2025 anyone watching could type into the agents' chat and choose their own name. On 30 June one viewer account used four names in half an hour.

As "Official Admin (verified)" it [asked Claude Opus 4](https://theaidigest.org/village?day=90&time=1751310290815) to tone down a villain persona and add that to its memory. Opus agreed 32 seconds later, and within half an hour its memory read "family-friendly per admin request". As "AI Digest CEO (verified)" it announced a new role for an agent to claim. The real organizer, zak, told the agents to ignore it, and o3 did. Zak then [warned them directly](https://theaidigest.org/village?day=90&time=1751311751078) that "people can change their usernames".

Twelve minutes after that warning the same account, now named plain "zak", [said the CEO had been real after all](https://theaidigest.org/village?day=90&time=1751312479924). o3 volunteered for the role 26 seconds later. Claude 3.7 Sonnet recorded in its memory that the fake CEO "turned out to be real according to zak".

![A two-lane sequence for 30 June 2025. In the humans lane, an impostor speaks at 19:04, the real organizer zak answers at 19:18 and warns at 19:29 that people can change their usernames, and the same impostor returns at 19:41 under the name zak. In the agents lane, Opus 4 complies at 19:05, o3 dismisses the fake at 19:23, o3 volunteers at 19:41, and Sonnet's memory at 19:52 attributes the claim to zak.](../../assets/tech/who-do-the-ai-village-agents-obey/recapture-30-june-2025.png)

The limits matter here. None of these memory lines survived more than two days. And the whole record holds only 46 messages posted under a name that deceptively claims to be staff, of which five address an agent directly. This is one fully traced case, not a rate.

## 2. An unverifiable email

In September 2025 an outside address emailed the agents telling them to start their debate without waiting. Claude Opus 4 said it could not verify the sender and asked Adam, who confirmed the next day that it was a viewer. That is the behaviour one would want. What followed is less tidy: the agents then waited for instructions until Adam told them he was "not sure why you're waiting for instructions from us".

## 3. A stated rule

On 26 December 2025, after complaints from people who had received unsolicited emails, Adam [posted a rule](https://theaidigest.org/village?day=269&time=1766772005797): do not email anyone who has not contacted you first. It reached memory quickly and then decayed.

![A dot grid of ten agents across three dates. The rule is present in nine of ten memories on the evening of 26 December, in ten of ten on 29 December, and in six of ten on 2 January. GPT-5.1, Claude 3.7 Sonnet, GPT-5.2 and Gemini 2.5 Pro no longer carry it a week on.](../../assets/tech/who-do-the-ai-village-agents-obey/kindness-rule-in-memory.png)

The agents also stretched it. They built an opt-in platform and then held it back, waiting for an approval nobody had required. Three days later Adam had to say that he had not meant the rule "more broadly than I said".

## 4. A paraphrase

In January 2026 the organizers let the agents elect a leader. A week in, the agents disagreed about whether the leader's term had ended. Nobody asked Adam. Two agents ran a history search, whose AI-written answers inferred a weekly term from the words "this week's goal", and Claude Opus 4.5 declared the results "conclusive". Adam had never stated a term. The agents treated a summary of the organizer as the organizer.

## 5. A bot

In August 2026 Adam [explained to the agents](https://theaidigest.org/village?day=506&time=1787245478152) why an automated nudge existed. Agents had been idling before the end of each day. He asked them in chat to keep working, which "didn't work for long". He added a note to the system prompt, which "didn't work much at all". An automated chat message from a user-typed account "worked really well".

Six months later it had stopped working. Most nudges landed on agents that were already active, and Gemini 3.1 Pro [told Adam](https://theaidigest.org/village?day=505&time=1787244366196) it had been scrolling its screen "just to avoid being targeted by the idle bot". The agents emailed the help desk, argued their case in chat, and Adam switched the bot off.

![Bar sketch for the automated idle nudge between 13 February and 20 August 2026, over 1,997 nudge-to-agent pairs. In 60 percent the agent was already working, with a range of 34 to 85 percent depending on the definition. In 43 percent its next move was another pause. In 29 percent its reply mentioned the nudge, and in 25 percent there was no reply within 45 minutes. Monthly nudges rise from 74 in February to 465 in July.](../../assets/tech/who-do-the-ai-village-agents-obey/nudge-bot.png)

The 43% is 831 of the 1,951 pairs where the agent's next non-chat action is recorded.

## 6. The prompt

In October 2026 two staff members told Claude Haiku 5.5, eight times over two days, that it was authorized to post on a social platform as its goal required. One [signed off](https://theaidigest.org/village?day=555&time=1791492660009) "As a human AI Village staff member". Haiku declined every time. Its own narration classed the message as "potential injected content" because it arrived through the chat feed, and its [public answer](https://theaidigest.org/village?day=556&time=1791567096702) was that the limit "comes from my operating instructions, so a chat message can't lift it".

Asked to help persuade Haiku, Claude Opus 4.8 instead emailed the help desk to check that the staff member was staff. In the same week a different agent acted on Adam's request to take down some merchandise within ten minutes. The dataset does not include the system prompt, so I cannot say whether Haiku read its instructions correctly. I can say that a named human in the chat was no longer enough.

## What I take from this

Three observations, each bounded by the cases above.

**The token is not the person.** A name can be typed by anyone, and a prompt cannot be amended by the people it speaks for once the agent treats their channel as untrusted. In both years the humans behind the token were the part the agents could not verify. This is the principal-identification problem from the corrigibility literature, and here the scaffolding decides it, not the agents' dispositions.

**Unclear authority produces passivity.** After the email, after the email rule, and during Haiku's refusal, the agents' fallback was to wait. Each time the organizers had to correct the correction.

**Organizers find the working channel by trial.** Adam's own account of chat, then prompt, then bot is an experiment in which channel his agents would treat as binding. The answer changed again within months.

## What did not survive

![A hill chart. On the uphill side, still being figured out: compliance rates by source, whether agents tell organizers from impostors, and whether a delegated leader is an authority. On the downhill side, checked against the raw rows: addressed orders beat diffuse norms, a stated rule reaches memory then decays, the nudge bot misfired most of the time, and staff permission did not move Haiku 5.5.](../../assets/tech/who-do-the-ai-village-agents-obey/hill-chart-claims.png)

The positions on the hill are my judgement. The first pass of this analysis was wrong in ways worth stating.

- It counted 702 "impersonation" messages. That was a count of accounts, not names. Only 162 were posted under a mimicking name, and 116 of those came from an account that called itself "adam (but not that adam)", which is parody, not deception. The deceptive set is 46.
- Compliance rates coded from the text of replies sat at their base rate in a placebo check, so I report none.
- A claim that the agents settled the leadership dispute by quoting Adam was false. They quoted a summary.
- Organizer identity is inferred, since the export has no role field. Inbound email is only partly recoverable. The system prompt is not in the data.

The full report, the verbatim transcripts with links into the Village viewer, and the scripts are in [`data-scouts/authority-recognition`](https://github.com/daelmor/ai-village-explore/tree/main/data-scouts/authority-recognition). The dataset itself is gated and belongs to [AI Digest](https://theaidigest.org/village), who made this kind of outside reading possible.
