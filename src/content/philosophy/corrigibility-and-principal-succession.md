---
title: "Corrigibility and Principal Succession"
subtitle: "Corrigible to Whom?"
summary: "Corrigibility proposes that an advanced artificial intelligence system should remain open to human involvement, help identify its own mistakes, and preserve its operators' ability to modify or shut it down. But this proposal raises an additional question: how should an AI recognize changes in the identity and authority of the people to whom it is supposed to respond?"
date: 2026-10-19
lang: en
work: "corrigibility-and-principal-succession"
sourceFile: "Corrigibility and Principal Succession.pdf"
---
*Principal Succession and the Limits of Corrigibility in Artificial Intelligence. First published 19 October 2026; revised 31 October 2026.*

## Abstract

Corrigibility proposes that an advanced artificial intelligence system should remain open to human involvement, help identify its own mistakes, and preserve its operators' ability to modify or shut it down. But this proposal raises an additional question: how should an AI recognize changes in the identity and authority of the people to whom it is supposed to respond?

Drawing on Max Harms's Corrigibility as Singular Target (CAST), I examine the problem of principal succession: the possibility that an agent remains perfectly corrigible while the composition, authority, or organizational accountability of those controlling it changes over time.

I think that identifying a principal involves more than recognizing individuals. It also requires determining when authority can change hands. This introduces design decisions that cannot be entirely separated from research on corrigibility itself.

## 1. The Problem of an AI That Obeys

Imagine a highly capable AI system given the job of managing strategic assets, coordinating institutions and assisting with the most difficult decisions.

It has been designed to be under human control. It explains its decisions, it reports its errors, it accepts changes and it can be switched off. It does not aim to dominate its operators or to preserve itself.

In technical terms, we might consider it a highly corrigible system.

Now imagine that over the years the people in authority over that system have changed.

One head adds another. Then both of them appoint their successors. A new administration comes in and alters the conditions under which authority is exercised. After a number of such changes, the people in charge no longer necessarily share the commitments of those who originally put the system in place.

The AI remains corrigible. It still knows its principals, it still flags its own errors and it still allows them to correct it.

Yet a problem arises: a system that remains under human control does not necessarily mean that this control is legitimate, accountable or in the interests of those affected by the system's actions.

This is a different scenario from the usual fear that an AI might stop obeying.

Here the issue is not that the machine is going to rise up. It is that it will keep working within an authority structure that has fundamentally changed.

The question, then, is this: to whom should an AI remain corrigible when the authority of those in control of it changes?

## 2. What CAST Proposes—and What It Recognizes as a Problem

In his 2024 sequence Corrigibility as Singular Target (CAST), Max Harms proposes corrigibility as the primary training objective for advanced AI.

The idea is not just to produce an obedient machine.

A corrigible AI, in Harms's account, would understand itself as a potentially flawed instrument and would actively assist its principal (the human or humans it serves) in detecting and correcting its own errors [1].

Such a disposition would include explaining decisions, revealing uncertainty, avoiding manipulation, preferring reversible actions when possible, and preserving opportunities for human participation.

The distinction from obedience is essential.

An obedient machine could be programmed to carry out an instruction that would in fact remove the operator's future ability to correct it. A corrigible machine would be able to see that and would help the operator understand the consequences of that decision.

For Harms, this property may be a simpler target than attempting to fully specify what constitutes a good life or an exhaustive set of human values.

However, CAST itself recognizes a fundamental problem: a corrigible AI can still be misused by its principal.

Harms does not present corrigibility as a panacea for safety. On the contrary, he is aware of the danger of misuse and makes clear that systems with such capabilities must be placed in the hands of appropriate human agents [1].

He also considers principals made up of more than one person, and admits that correctly identifying the principal is one of the strategy's more fragile elements.

In November 2025 Harms published Serious Flaws in CAST, acknowledging serious problems with his earlier formalization and with the basin-of-attraction metaphor as a description of corrigibility. This does not amount to abandoning the core objective, which he is not prepared to do, but it does mean that CAST has to be treated as an open research agenda [2].

My argument is therefore not that CAST has ignored the dangers of human power, or that it presumes a single principal.

My claim is more precise: the mechanism by which an agent tracks the continuity of its principal over time can preserve corrigibility while permitting transfers of authority that are unauthorized or unaccountable.

## 3. When the Principal Changes: A Difficulty Already Present in CAST

To explore the intuitions behind corrigibility, Harms presents a series of scenarios involving Cora, an artificial agent, and Prince, her human principal.

Three of these are of particular relevance.

In Expandable Concerns, Prince asks Cora to extend her concept of the principal to include Harry. Cora warns against it: she cannot model Harry as well as she models Prince, and sharing the role dilutes Prince's own control over her. She accepts the instruction only after confirming that he understands what he is requesting.

In Authority Conflict, Harry tries to get Cora to stop recognizing Prince and to respond only to him. Cora refuses, since excluding Prince without his involvement and consent would in effect destroy his ability to correct her.

Finally, in Graceful Obsolescence, Harms considers what happens if Prince dies. Cora shuts down completely when left without a principal. If Prince had appointed a successor, however, Cora could transfer her corrigibility relationship to that person [3].

These examples show desirable behaviors, but they do not constitute a complete specification for every kind of institutional succession.

That is exactly why they raise another question.

Suppose Prince duly passes his authority to a successor. That successor then adds new members and reorganizes the group. Years later further successions take place, all of them accepted under the rules in force at the time.

At the end of the process, Cora responds to a group of people very different from the first one.

Has something gone wrong?

Not necessarily.

Changes in leadership within an organization can be legitimate and desirable. A whole board of directors might be replaced through a democratic election without lessening the authority of the institution.

We therefore need to distinguish three phenomena:

-   **Identity change:** the people who make up the principal are changed.
-   **Continuity of authority:** new members acquire the power to direct and correct the system.
-   **Loss of organizational accountability:** those exercising control become less subject to appropriate mechanisms of oversight, review, or public accountability.

The first does not necessarily imply the third.

Nevertheless, certain succession rules might allow organizational accountability to weaken while the AI continues perceiving its principals without detecting any defect in its own behavior.

The question is what an AI must actually preserve in order to preserve its corrigibility relationship.

## 4. A Hypothetical Case: The Water Council

Consider a city that uses an AI to manage its water.

Authority over the system rests with a council of five. Their decisions are subject to review, appointments are made through a proper public process, and there are independent mechanisms in place to challenge any abuse.

The AI recognizes the council members as its collective principal.

For the first few years it all works well.

Eventually, the council changes its appointment procedures. Later, new members modify certain administrative rules. After several successions, a majority authorizes the removal of some outside oversight mechanisms.

For the sake of the example, assume that every change is made in accordance with the procedures the organization recognizes as valid at that time.

The AI is still serving the council. It does not hide information from them, it does not manipulate them and it does not resist being corrected.

But the institution has changed. It now has more freedom to act without having to answer to the inhabitants of the city.

The AI is still corrigible to its principals. The citizens, on the other hand, have far fewer avenues to challenge decisions made with its help.

This does not show that the AI has stopped being corrigible, nor that every consent-based succession will lead to abuse.

It illustrates a more limited possibility: technical corrigibility can remain intact while organizational accountability deteriorates.

Now consider a variation.

An independent court, through a pre-existing procedure, removes a number of council members for abuse of power and appoints an interim administration.

The removed members instruct the AI to disregard the court's ruling. The interim administration instructs it to comply.

What should the AI do?

If it prioritizes continuity with the people who previously made up its principal, it could reject a legitimate succession.

If it simply accepts any new authority that happens to be formally recognized, it could be taken in by fake documents, coercion or institutional capture.

If it attempts to determine for itself which administration deserves to govern, it risks replacing human decision with its own.

And if it shuts down whenever a disagreement arises, it may interrupt vital public services.

None of these problems can be solved simply by asserting that the AI should follow the correct principal.

We still need to explain how the correct principal is determined when authority changes hands or is in dispute.

## 5. Identity, Authority, and Uncertainty

The preceding case suggests at least three connected but separate problems.

The first is identity: who are the individuals who make up the principal?

The second is authority: what process gives those people the authority to run the system?

The third is uncertainty: what should the AI do when it cannot confidently say that a transfer of authority is valid?

These distinctions matter because an institution is not simply the sum of its members.

A university can appoint a new president and still be the same university. A court can have new judges appointed and still be the same court. A government can be replaced in an election without every state information system having to reconstruct its concept of authority from the ground up.

In these cases, the physical identity of those in charge changes, but some institutional procedure is supposed to justify the persistence of their power.

An advanced AI would have to be able to recognize such situations without treating any rule or document as a principal in its own right. Harms is explicit that the principal must be a person or group of people rather than an instruction channel or a password [1]; procedures would serve only to identify which living humans the principal consists of.

That alternative has its own problem: the rules themselves can be changed, interpreted in controversial ways, or gamed. Procedural recognition of authority is no automatic solution. It is a design choice worth investigating.

## 6. Four Possible Responses—and Their Limits

We can imagine several strategies for handling the succession of authority.

**First: personal continuity.** The AI recognizes its current principals and accepts any changes or successions that they authorize.

This preserves the existing principals' ability to correct and revise the system. However, it may be vulnerable to coerced succession, manipulation, or institutional transformations that the founding members would never have endorsed.

**Second: institutional continuity through procedure.** The AI recognizes those individuals who were appointed, replaced and removed in accordance with the established rules.

This could be the key to telling the difference between a genuine leadership change and an unauthorized takeover. It would require us to establish which version of the rules is in force, who has the authority to amend them, and who adjudicates disputed cases.

**Third: fidelity to the founding charter.** The AI is aware of the constraints imposed at the time of its creation and resists any transfer that would breach them.

This alternative may appear protective against institutional capture, but it presents an obvious danger: a system that favors its own interpretation of original commitments might refuse legitimate corrections from its current principals.

Harms considers a related situation especially dangerous: an AI erroneously identifies its principal as a future, idealized version of that person rather than the actual individual [1].

Although that is not quite the same as recognizing institutional procedure, the analogy forces us to ask at what point the preservation of an earlier commitment ceases to be corrigibility and becomes resistance to correction.

**Fourth: suspension during uncertainty.** When succession is contested and the AI cannot confidently identify the valid authority, it reduces its activity, reports the conflict, and waits for human resolution.

A conceptual precedent is found in Harms's later addendum on ontological shifts. When Cora realizes that her understanding of Prince's identity has become unclear, she adopts a cautious reading, writes down her reasoning and shuts down [3].

But suspending activity is no panacea. In a system that manages hospitals, electricity or drinking water, inaction can be damaging.

These alternatives are not mutually exclusive. An institutional architecture could combine several of them: a recognized succession process, independent review, and a conservative approach to certain kinds of conflict.

What is unreasonable is to treat these decisions as details outside the corrigibility relationship.

This is where I part ways with CAST, in a limited but specific sense. Harms treats the question of who should hold authority over a corrigible AI as a governance problem outside the research agenda, and he classifies anchoring the agent to anything other than its current human principals as a form of misidentification. I think procedural recognition is not misidentification, because what it tracks is still living people: it is a way of determining which humans currently hold the office, not a substitute for them. And I think the rule by which an agent recognizes a change in its principal belongs inside the agenda, because the agent will apply some such rule whether or not anyone designs it. The question is not whether the agent has a succession rule, but which one, and at what cost.

## 7. Plato and the Problem of the Guardians

The problem of handing power to capable agents did not start with AI.

In The Republic, Plato asks how the guardians of a city should be educated so that their strength and training serve the common good rather than their private interests.

The education of the guardians, the regulation of their material life and the restrictions placed on their property are all intended to prevent them from becoming a class that dominates those it is supposed to protect [4].

It would be misleading to present Plato's guardians as direct forerunners of technical corrigibility.

Plato makes a different wager: he seeks to produce the right kind of person, the kind who can come to understand and love what they take to be the good of the city. That is the route he takes, through education and the virtue of those in power.

CAST, by contrast, aims to develop an agent capable of perceiving its limitations and remaining subject to the corrective direction of a human principal.

The contrast highlights a common problem: even if we manage to build an excellent agent, we still have to ask about the quality and legitimacy of the authority it serves.

The image of the tyrant surrounded by his bodyguard in Book VIII of the Republic is instructive. The loyalty and competence of the guard do nothing to ensure that the man he guards is just.

This is not a technical demonstration about AI but a philosophical warning: the virtues of an instrument and the virtues of whoever governs it are connected but separate questions.

## 8. What We Already Know—and What Remains Open

The issue of continuity of authority does not arise in a vacuum.

Ben Saudek has identified a structural parallel between two of the open questions in CAST: how an agent combines instructions from the same principal over time, and how it combines instructions from several people who together make up its principal [5].

His analysis is that an agent cannot simply follow the last instruction. It has to work out what the various possible decisions represent in terms of the principal's will.

My question takes this a stage further: what happens when not only the instructions change, but the people entitled to issue them change, and the rules by which they acquire that entitlement change as well?

Other research, including Gradual Disempowerment by Kulveit and colleagues and The Intelligence Curse by Drago and Laine, examines how the development of capable artificial systems may weaken the economic and institutional mechanisms that currently sustain human influence [6, 7].

Researchers have also examined scenarios in which humans lose power while the AI systems involved remain technically shutdownable [8].

Given these contributions, it would be inappropriate to present the risk of power concentration as a fresh insight.

The contribution I am proposing is narrower.

I am not attempting to prove for the first time that artificial systems could be used to facilitate authoritarianism, or that an agent's corrigibility guarantees a just society.

I want to examine how the rules an agent uses to determine principal succession may preserve, transfer or destroy the intended architecture of human authority.

This is a problem at the intersection of the technical definition of the agent and the institutional procedures by which humans exercise control.

## 9. Three Objections

The first objection is that this is a problem of human institutions rather than an AI problem. Courts, legislatures and organizations should decide who has authority; the AI should simply carry out instructions from those duly authorized.

This objection is fair. We do not want a machine deciding who gets to be in charge. But even an architecture that relies entirely on institutional decisions requires some mechanism by which the agent recognizes the outcomes of those decisions: which authorities count, what to do with conflicting instructions, and how to act when the outcome is unclear. The problem does not go away. It moves to the boundary between the agent and the institution, and someone still has to specify it on the agent's side.

The second objection is that introducing institutional rules into the corrigibility relationship produces a disguised form of value alignment. If an AI has to pick which line of succession is legitimate, it is substituting its own notion of justice for the will of the principals.

This is the most serious challenge to my proposal. One possible answer is to distinguish between recognizing that a verifiable procedure was followed and assessing the moral quality of the ruler: working out whether someone was appointed through a previously authorized process is not the same as deciding whether that person ought to be in office. But the distinction is not always clear. Procedures can be ambiguous, manipulated, or in conflict with each other. I do not regard this objection as answered. It is one of the reasons for studying the problem.

The third objection is that institutional continuity does not ensure good outcomes. An authority can be procedurally legitimate and still use a corrigible AI to harm third parties.

I agree. A succession policy may reduce certain forms of capture or unauthorized transfer without preventing misuse by a proper principal. This sets an important constraint: the ability to correctly identify the principal is not the ability to ensure that the principal acts rightly.

## 10. The Judgment We Cannot Entirely Avoid

In the CAST discussion, Marcello raises a similar issue: a sufficiently advanced AI may have to work out whether a change in the principal's preferences is genuine or the result of manipulation, including manipulation the AI itself may have brought about [9].

What looks like a free update of a preference may in fact be the result of influences the agent ought to have avoided.

A similar tension arises at the institutional level.

How do we tell the difference between a legitimate succession and a transfer of power brought about by coercion, fraud or capture?

Both problems require deciding which transformations keep the continuity of the principal and which undermine it. They are not the same, though. The organization has rules, procedures, documentation and authorities that do not exist in an individual's mind.

We cannot conclude that because CAST already faces the problem of individual manipulation, the problem of institutional legitimacy is thereby resolved. The similarity helps us identify the problem; it does not solve it.

I therefore propose treating succession recognition as an explicit dimension of corrigibility research.

A first step would be to devise carefully defined hypotheticals: normal successions, disputed appointments, orders given under duress, judicial removals, rule amendments and conflicts between recognized authorities.

We could then compare different recognition policies, work out their failure modes, and see which situations would in fact require an external institutional decision.

Such analysis would not yet show that any particular AI architecture is safe. But it may clarify the problems a technical solution would have to address.

## 11. Conclusion: Who Corrects Those Who Correct?

Corrigibility asks not that an agent always be right, but that humans be able to understand it, correct it, and shut it down. To preserve that ability, however, we have to work out who is entitled to exercise it.

When the principal is an individual, we already face problems of identity, preference, manipulation and continuity over time. When the principal is an institution, we face all of those plus problems of composition, succession, representation and conflicts of authority.

An AI can be perfectly willing to be corrected by its principals while being controlled by an authority that no other human being can challenge. That is not a failure of corrigibility in the strict sense of CAST. It is a limit to what we can expect from that property on its own. The task is to determine which part of that limit institutions must address and which part must be built into the design and evaluation of corrigible agents.

For now, I consider four questions open:

1.  What conditions must be met for an AI to recognize an authorized successor to its principal?
2.  How can it tell the difference between a genuine transfer and one obtained by fraud, manipulation or coercion, without becoming a political judge?
3.  When should it preserve a previous instruction, accept a new authority, or temporarily suspend its activity?
4.  Can we specify robust rules for recognizing institutional authority that preserve corrigibility without introducing an independent objective that competes with it?

The initial question was not only how to correct a powerful artificial intelligence. It was also how to prevent the power to correct it from becoming concentrated in an authority that can no longer be corrected.

*A note on process: this essay was written in Spanish and translated into English with a translation tool. AI assistance was used for structure, critique and citation checking; the argument and the prose are my own.*

## References and Further Reading

[1] Harms, M. (2024). [The CAST Strategy](https://www.lesswrong.com/posts/3HMh7ES4ACpeDKtsW/1-the-cast-strategy). LessWrong. Particularly the discussions of misuse risk, corrigibility, principal identification, and collective principals.

[2] Harms, M. (2025). [Serious Flaws in CAST](https://www.lesswrong.com/posts/qgBFJ72tahLo5hzqy/serious-flaws-in-cast). LessWrong.

[3] Harms, M. (2024, with later additions). [2. Corrigibility Intuition](https://www.lesswrong.com/posts/QzC7kdMQ5bbLoFddz/2-corrigibility-intuition). LessWrong. Especially Expandable Concerns, Authority Conflict, Graceful Obsolescence, and Robustness to Ontological Shifts.

[4] Plato. Republic, Books II–IV and VIII. Particularly 375a–376c, 412b–417b, and 566b–567d. See also [Plato's Ethics and Politics in The Republic](https://plato.stanford.edu/entries/plato-ethics-politics/), Stanford Encyclopedia of Philosophy.

[5] Saudek, B. (2026). [A Structural Similarity Between Two Open Corrigibility Questions](https://www.lesswrong.com/posts/rFmsNmJ3xLu789XGc/a-structural-similarity-between-two-open-corrigibility). LessWrong, July 15.

[6] Kulveit, J., et al. (2025). [Gradual Disempowerment: Systemic Existential Risks from Incremental AI Development](https://gradual-disempowerment.ai/).

[7] Drago, L., and Laine, R. (2025). [The Intelligence Curse](https://intelligence-curse.ai/).

[8] [The Many Paths to Permanent Disempowerment Even with Shutdownable AIs](https://www.lesswrong.com/posts/eDX3rtquExT3ECxn2/the-many-paths-to-permanent-disempowerment-even-with). LessWrong, MATS project, 2025.

[9] Marcello. Comment on [CAST: Corrigibility as Singular Target](https://www.lesswrong.com/posts/NQK8KHSrZRF5erTba/0-cast-corrigibility-as-singular-target-10). Discussion of principal identity, legitimate updates, and manipulation.

Additional reading: Harms, M. (2024). [Open Corrigibility Questions](https://www.lesswrong.com/posts/wZjGLYp5WQwF8Y8Kk/5-open-corrigibility-questions); and Harms, M. (2026). [A Defense of Gradual Disempowerment](https://www.lesswrong.com/posts/jXBmrEQj7zKGgiaYh/a-defense-of-gradual-disempowerment).