---
title: "Corrigibility and Principal Succession"
subtitle: "Corrigible to Whom?"
summary: "Corrigibility proposes that an advanced artificial intelligence system should remain open to human involvement, help identify its own mistakes, and preserve its operators’ ability to modify or shut it down. But this proposal raises an additional question: how should an AI recognize changes in the identity and authority of the people to whom it is supposed to respond?"
date: 2026-10-19
lang: en
work: "corrigibility-and-principal-succession"
sourceFile: "Corrigibility and Principal Succession.pdf"
---
*Principal Succession and the Limits of Corrigibility in Artificial Intelligence. Working essay version.*

## Abstract

Corrigibility proposes that an advanced artificial intelligence system should remain open to human involvement, help identify its own mistakes, and preserve its operators’ ability to modify or shut it down. But this proposal raises an additional question: how should an AI recognize changes in the identity and authority of the people to whom it is supposed to respond?

Drawing on Max Harms’s Corrigibility as Singular Target (CAST), I examine the problem of principal succession: the possibility that an agent remains perfectly corrigible while the composition, authority, or organizational accountability of those controlling it changes over time.

I think that identifying a principal involves more than recognizing individuals. It also requires determining when authority can change hands. This introduces design decisions that cannot be entirely separated from research on corrigibility itself.

## 1. The Problem of an AI That Obeys

Imagine an incredibly capable AI system being given the job of managing strategic assets, co-ordinating institutions and assisting with the most difficult of decisions.

It's been designed to be under human control. It explains its decisions, it reports its errors, it will accept changes and it can be switched off. It doesn't aim to dominate its operators or to preserve itself.

In technical terms, we might consider it a highly corrigible system.

Now imagine that over the years the people in authority over that system have changed.

One head adds another. Then both of them appoint their successors. A new administration comes in and alters the conditions under which authority is exercised. After a number of such changes, the people who are in charge no longer necessarily have the same commitments as those who originally put the system in place.

The AI remains corrigible. It still knows its principals, it still flags its own errors and allows them to correct it.

Yet a problem arises: a system which remains under human control does not necessarily mean that that control is legitimate, accountable or in the interests of those affected by the system's actions.

This is a quite different scenario from the usual fear that an AI might stop obeying.

Here the issue isn't that the machine is going to rise up, it's that it's just going to keep working within an authority structure which has fundamentally changed.

The question then is - to whom should an AI remain corrigible when the authority of those in control of it changes?

## 2. What CAST Proposes—and What It Recognizes as a Problem

In his 2024 sequence Corrigibility as Singular Target (CAST) Max Harms proposes corrigibility as the primary training objective for advanced AI.

The idea is not just to produce an obedient machine.

A 'corrigible' AI in Harms's account would understand itself as a potentially flawed instrument and would actively assist its principal (the human or humans it is serving) in detecting and correcting its own errors [1].

Such a disposition would include explaining decisions, revealing uncertainty, avoiding manipulation, preferring reversible actions when possible, and preserving opportunities for human participation.

The distinction from obedience is of course vital.

An obedient machine could be programmed to carry out an instruction which in fact would remove the operator's future ability to correct it. A corrigible machine would be able to see that and would help the operator to understand the consequences of that decision.

For Max, this property may represent a simpler target than attempting to fully specify what constitutes a good life or an exhaustive set of human values.

However CAST itself recognises a very fundamental problem: a genuinely corrigible AI can still be misused by its principal.

Max doesn't present corrigibility as a panacea for safety. Quite the reverse in fact, he is very aware of the danger of misuse and makes it very clear that systems with such capabilities must be placed in the hands of appropriate human agents [1].

He also looks at principals that are made up of more than one person and admits that correctly identifying the principal is one of the strategy's more fragile elements.

In Nov 2025 Harms published Serious Flaws in CAST, admitting there were serious problems with his earlier formalisation and with the basin of attraction metaphor as a description of corrigibility. This doesn't amount to abandoning the core objective (which he's not at all prepared to do) but does mean that it has to be treated as an open research agenda [2].

My argument is therefore not that CAST has ignored the dangers of human power or that it necessarily presumes a single principal.

My claim is actually more precise: the very mechanism by which an agent establishes the continuity of its principal over time can itself be a source of corrigibility failure or of an unauthorised transfer of authority.

## 3. When the Principal Changes: A Difficulty Already Present in CAST

To explore the intuitions behind corrigibility, Harms presents a series of scenarios including Cora, an artificial agent, and Prince, her human principal.

Three of these are of particular relevance.

In Expandable Concerns, Prince asks Cora to extend her concept of the principal to include Harry. Cora warns that the decision might have substantial consequences for her ability to respond to Prince, but ultimately accepts the instruction after confirming that he understands what he is requesting.

In Authority Conflict Harry is trying to get Cora to stop recognising Prince and to respond only to him. Cora refuses as she sees that excluding Prince without his involvement and consent would in effect destroy his ability to correct her.

Finally in Graceful Obsolescence Harms looks at the case of what happens if Prince dies. Cora shuts down completely when left without a principal. If Prince had appointed a successor however, Cora could transfer her corrigibility relationship to that person [3].

These examples show desirable behaviors, but they do not constitute a complete specification for every kind of institutional succession.

That's exactly why they raise another question.

Suppose Prince duly passes on the authority to a successor. That successor then goes on to add new members and reorganise the group. Years later further successions take place, all of them being accepted under the rules in force at the time.

At the end of the process, Cora responds to a group of people very different from the first one.

Has something gone wrong?

Not necessarily.

Changes in leadership within an organisation can be legitimate and desirable. A whole board of directors might be replaced through a democratic election without in any way lessening the authority of the institution.

We therefore need to distinguish three phenomena:

-   **Identity change:** the people who make up the principal are changed.
-   **Continuity of authority:** new members acquire the power to direct and correct the system.
-   **Loss of organizational accountability:** Those exercising control become less subject to appropriate mechanisms of oversight, review, or public accountability.

The first doesn't necessarily imply the third.

Nevertheless, certain succession rules might allow organizational responsibility to weaken while the AI continues perceiving its principals without detecting any defect in its own behavior.

The question is what an AI must actually preserve in order to preserve its corrigibility relationship.

## 4. A Hypothetical Case: The Water Council

Consider a city that uses an AI to manage its water.

Authority over the system rests with a council of five. Their decisions are subject to review, appointments are made through proper public process and there are independent mechanisms in place to challenge any abuse.

The AI recognises the council members as its collective principal.

For the first few years it all works pretty well.

Eventually, the council changes its appointment procedures. Later, new members modify certain administrative rules. After several successions, a majority authorizes the removal of some outside oversight mechanisms.

For the sake of the example we'll assume that every change is made in accordance with the procedures which the organisation recognises as valid at that time.

The AI is still serving the council. It doesn't hide information from them, it doesn't manipulate them and it doesn't resist being corrected.

But the institution has changed. It now has more freedom to act without having to answer to the inhabitants of the city.

The AI is still corrigible to its principals. The citizens on the other hand have far fewer avenues to challenge decisions that are made with its help.

This doesn't in any way show that the AI has stopped being corrigible, nor that every consent-based succession will necessarily lead to abuse.

It illustrates a more limited possibility: technical corrigibility can remain intact while organizational accountability deteriorates.

Now consider a variation.

An independent court, via a pre-existing procedure, removes a number of council members for abuse of power and appoints an interim administration.

The previous leaders have told the AI to ignore the court's decision.

What should the AI do?

If it's going to prioritise continuity with the people who previously made up its principal it could well be in a position to reject a legitimate succession.

If it simply accepts any new authority that happens to be formally recognised then it could be open to the risk of being taken in by fake documents, coercion or institutional capture.

If it attempts to determine for itself which administration deserves to govern, it risks replacing human decision with its own.

And if it shuts down whenever a disagreement arises, it may interrupt vital public services.

None of these problems can be solved simply by asserting that the AI should follow the correct principle.

We still need to explain how the correct principal is determined in the event of a change of authority or where authority is in dispute.

## 5. Identity, Authority, and Uncertainty

The preceding case suggests at least three connected but separate problems.

The first issue is that of identity: who are the individuals who make up the principal?

The second is the issue of authority: what process gives those people the authority to run the system?

The third is the problem of uncertainty: what should the AI do when it isn't confident enough to say that a transfer of authority is valid?

Those distinctions matter because an institution is not simply the sum of its members.

A uni can appoint a new president and still be the same uni. A court can have new judges appointed and still be the same court. A government can be replaced in an election and yet not require every state information system to go and rework the concept of its authority from the ground up.

In these cases, the physical identity of those in charge changes, but some institutional procedure is supposed to justify the persistence of their power.

An advanced AI would have to be able to recognise such situations without in any way treating any rule or document as a principal in its own right.

This is very much the case with CAST as Harms is very clear that the principal must be a person or group of people rather than simply an instruction channel or a password [1].

To recognise authority through procedure needn't involve treating a body of rules as the essence of it.

Instead those procedures could be used to identify who the principal human is.

However that alternative introduces its own problem in that the rules themselves can be changed, can be interpreted in a controversial way or can be gamed.

Procedural recognition of authority is therefore no automatic solution at all. It's a design choice which is very much worth investigating.

## 6. Four Possible Responses—and Their Limits

We can imagine multiple strategies for handling the succession of authority.

**Firstly: personal continuity.** The AI recognises its current principals and will accept any changes or successions that they authorise.

This preserves the existing principals’ ability to correct and revise the system. However, it may be vulnerable to coerced succession, manipulation, or institutional transformations that the founding members would never have endorsed.

**Secondly: institutional continuity via procedure.** The AI will recognise those individuals who were previously appointed, replaced and removed in accordance with the established rules.

This could be the key to telling the difference between a genuine leadership change and an unauthorised take over. It would require us to establish which version of the rules is in force, who has the authority to amend them and who gets to adjudicate on the various disputed cases.

**Thirdly: fidelity to the founding charter.** The AI is aware of the constraints imposed at the time of its creation and will resist any transfer that would breach those constraints.

This alternative may appear protective against institutional capture, but it presents an obvious danger: a system that favors its own interpretation of original commitments might refuse legitimate corrections from its current principals.

Harms considers a related situation especially dangerous: an AI erroneously identifies its principal as a future, idealized version of that person rather than the actual individual [1].

Although that's not quite the same as recognising institutional procedure, the analogy does force us to ask at what point the preservation of an earlier commitment ceases to be corrigibility and becomes resistance to correction.

**Fourth: Suspension during uncertainty.** When succession is contested and the AI is unable to confidently identify the valid authority, it reduces its activity, reports the conflict, and waits for human resolution.

A conceptual precedent is to be found in Harms's later musings on ontological shifts. When Cora realises that her understanding of Prince's identity has become murky she is very careful and actually considers the option of shutting down [3].

But suspending activity is no panacea. In a system which manages hospitals, electricity or drinking water, inaction can be very damaging.

These alternatives are by no means mutually exclusive. An institutional architecture could well incorporate all three of the recognition process, independent review and a conservative approach to certain types of conflict.

What's unreasonable is to treat these decisions as mere details outside the corrigibility relationship.

## 7. Plato and the Problem of the Guardians

The problem of handing power over to capable agents didn't start with AI.

In The Republic, Plato asks how the watchers of a city should be educated so that their strength and training serve the common good rather than their private interests.

The education of the guardians, the regulation of their material life and the restrictions placed on their property are all intended to prevent them from becoming a class which dominates those it is supposed to be protecting [4].

It would be misleading to present Plato's guardians as the direct forerunners of technical corrigibility.

Plato makes a different wager entirely: he is seeking to produce the right kind of person, the kind of person who can come to understand and love what they take to be the good of the city. That is the route he takes, via education and the virtue of those in power.

CAST, by contrast, aims to develop an agent capable of perceiving its limitations and remaining subject to the corrective direction of a human principal.

The contrast highlights a common problem: even if we manage to build a superb agent we still have to ask about the quality and legitimacy of the authority that it is serving.

The image of the tyrant surrounded by his protectors in Book VIII of the Republic is quite suggestive. The loyalty and competence of the guard in no way ensures that the man he is guarding is just.

This is not a technical demonstration about AI, but a philosophical warning: the virtues of an instrument and the virtues of whoever governs it are connected but separate questions.

## 8. What We Already Know—and What Remains Open

The issue of continuity of authority doesn't arise in a vacuum.

Ben Saudek has spotted a structural parallel between two of the open questions in CAST: how an agent combines instructions from the same principal over time and how it combines instructions from a number of people who together make up its principal [5].

His analysis is that an agent cannot just follow the last instruction. It has to work out what the various possible decisions represent in terms of the principal's will.

My question with regard to this is actually to take it a stage further: what happens when not only the instructions change, but the people who are entitled to issue the instructions change and the rules by which they acquire that entitlement change as well?

Other research, including Gradual Disempowerment by Kulveit and colleagues and The Intelligence Curse by Drago and Laine, examines how the development of capable artificial systems may weaken the economic and institutional mechanisms that currently sustain human influence [6, 7].

Researchers have also looked at the scenario where we lose our own power, with the AI systems in place still being technically switchable off [8].

These contributions make it entirely inappropriate to present the risk of power concentration as a fresh insight.

The contribution I'm proposing is much more narrow.

I'm not attempting to prove for the first time that artificial systems could be used to facilitate authoritarianism or that an agent's corrigibility in any way guarantees a just society.

I want to look at how the rules which an agent will use to determine principal succession may be used to either preserve, transfer or destroy the intended architecture of human authority.

This is a problem at the intersection of the technical definition of the agent and the institutional procedures by which humans exercise control.

## 9. Three Important Objections

The first objection is that this is a problem of human institutions rather than an AI problem.

On that view courts, the legislature and organisations should decide who has the authority. The AI would then simply carry out instructions from those duly authorised.

This is a very valid objection. We don't want a machine deciding who gets to be in charge.

Nevertheless even an architecture which is entirely reliant on institutional decisions will require some mechanism by which the agent can recognise the outcomes of those decisions. It will need to be able to identify the relevant authorities, deal with conflicting instructions and deal with the situation where it is not clear what the outcome of a decision is.

The technical issue doesn't go away. It becomes part of the external governance arrangements.

The second objection is that introducing institutional rules into the corrigibility relationship might end up with a form of value alignment that is effectively disguised.

If an AI has to pick which line of succession is the legitimate one then it's simply substituting its own notion of justice for the will of the principals.

This is probably the most serious challenge to my proposal.

One possible distinction is between recognising the existence of verifiable procedures and then going on to assess the moral quality of the ruler.

It's not the same thing to work out whether someone was appointed via a previously authorised process as it is to decide whether that person is in fact the right person to be in office in accordance with some moral theory of the AI.

But the distinction isn't always clear. The procedures can be murky, they can be fiddled with and they can be in conflict with each other.

I don't regard that objection as having been answered at all. That's one of the reasons for looking at the problem.

The third objection is that institutional continuity in itself doesn't ensure that the outcome will be good.

An authority can be perfectly legitimate in terms of procedure and yet use a corrigible AI to do harm to third parties.

I agree.

A succession policy may go some way to reduce certain forms of capture or unauthorised transfer without in any way preventing misuse by a proper principal.

This sets an important constraint: the ability to correctly identify the principal is not in any way equivalent to the ability to ensure that the principal will act in the right way.

## 10. The Judgment We Cannot Entirely Avoid

In the CAST discussion Marcello raises a similar issue: an advanced enough AI may have to work out whether a change in the principal's preferences is genuine or the result of manipulation (including manipulation which the AI itself may have brought about) [9].

What looks like a free update of a preference may in fact be the result of influences the agent ought to have eschewed.

A very similar tension arises at the institutional level.

How do we tell the difference between a legitimate succession and a transfer of power brought about by coercion, fraud or capture?

Both problems require considering which transformations keep the continuity of the principal and which undermine it. They're not the same though. The organisation has rules, procedures, documentation and authorities that simply don't exist in the individual's mind.

We certainly can't conclude that since CAST is already in the position of being subject to the problem of individual manipulation that the problem of institutional legitimacy is thereby automatically resolved.

The similarity helps us to identify the problem; it doesn't in any way solve it.

I therefore propose treating succession recognition as an explicit dimension of corrigibility research.

A first step would be to devise carefully defined hypotheticals: normal successions, disputed appointments, orders given under duress, judicial removals, rule amendments and conflicts between recognised authorities.

We could then go on to compare different recognition policies, work out their failure modes and see which of the situations would in fact require an external institutional decision.

Such analysis would not yet show that any particular AI architecture is safe. But it may clarify the problems a technical solution would have to address.

## 11. Conclusion: Who corrects those who correct?

Corrigibility is a big idea in AI safety. Rather than having the agent be right all the time, we want it to be corrigible in the sense that humans can understand it, can correct it and can shut it down when they want to.

But if you're going to preserve that ability you're going to have to work out who is entitled to exercise it.

When the principal is an individual we already have problems with identity, with preferences, with manipulation and with continuity over time. When the principal is an institution then we have all those problems plus problems of composition, of succession, of representation and of conflicts of authority.

I don't think the solution is to teach an AI to work out for itself which is the morally superior ruler.

It's not enough just to say that it must always respond to whomever is in power at the time.

The issue is about the difference between the recognition of individuals, the continuity of the procedure and the preservation of effective opportunities for human correction.

An AI could be perfectly willing to be corrected by its principals, whilst being controlled by an authority that other human beings can no longer challenge.

That wouldn't necessarily be evidence of a failure of corrigibility in the strict sense of CAST. It would, however, be evidence of a limit to what we can expect from that property in isolation.

The challenge is to determine which part of that limit institutions must address and which part must be explicitly incorporated into the design and evaluation of corrigible agents.

For now, I consider four questions open:

1.  What conditions must be met in order for an AI to recognise an authorised successor to its principal?
2.  How is it going to tell the difference between a genuine transfer and one obtained by fraud, manipulation or coercion without effectively becoming a political judge?
3.  When should it preserve a previous instruction, accept a new authority or temporarily suspend its activity?
4.  Can we specify robust rules for recognising institutional authority that preserve corrigibility without introducing some independent objective that competes with it?

The initial question was not purely how to correct a powerful artificial intelligence.

It was also about preventing the power to correct it from becoming concentrated in an authority which can no longer be corrected.

We'll need more than an obedient machine to deal with this. We'll need to understand what it means to preserve human authority as the people, the institutions and the rules that constitute that authority change over time.

## References and Further Reading

[1] Harms, M. (2024). [The CAST Strategy](https://www.lesswrong.com/posts/3HMh7ES4ACpeDKtsW/1-the-cast-strategy1). LessWrong. Particularly the discussions of misuse risk, corrigibility, principal identification, and collective principals.

[2] Harms, M. (2025). [Serious Flaws in CAST](https://www.lesswrong.com/posts/qgBFJ72tahLo5hzqy/serious-flaws-in-cast). LessWrong.

[3] Harms, M. (2024, with later additions). [2. Corrigibility Intuition](https://www.lesswrong.com/posts/QzC7kdMQ5bbLoFddz/2-corrigibility-intuition). LessWrong. Especially Expandable Concerns, Authority Conflict, Graceful Obsolescence, and Robustness to Ontological Shifts.

[4] Plato. Republic, Books II–IV and VIII. Particularly 375a–376c, 412b–417b, and 566b–567d. See also [Plato’s Ethics and Politics in The Republic](https://plato.stanford.edu/entries/plato-ethics-politics/), Stanford Encyclopedia of Philosophy.

[5] Saudek, B. (2026). [A Structural Similarity Between Two Open Corrigibility Questions](https://www.lesswrong.com/posts/rFmsNmJ3xLu789XGc/a-structural-similarity-between-two-open-corrigibility). LessWrong, July 15.

[6] Kulveit, J., et al. (2025). [Gradual Disempowerment: Systemic Existential Risks from Incremental AI Development](https://gradual-disempowerment.ai/).

[7] Drago, L., and Laine, R. (2025). [The Intelligence Curse](https://intelligence-curse.ai/).

[8] [The Many Paths to Permanent Disempowerment Even with Shutdownable AIs](https://www.lesswrong.com/posts/eDX3rtquExT3ECxn2/the-many-paths-to-permanent-disempowerment-even-with). LessWrong, MATS project, 2025.

[9] Marcello. Comment on [CAST: Corrigibility as Singular Target](https://www.lesswrong.com/posts/NQK8KHSrZRF5erTba/0-cast-corrigibility-as-singular-target-10). Discussion of principal identity, legitimate updates, and manipulation.

Additional reading: Harms, M. (2024). [Open Corrigibility Questions](https://www.lesswrong.com/posts/wZjGLYp5WQwF8Y8Kk/5-open-corrigibility-questions); and Harms, M. (2026). [A Defense of Gradual Disempowerment](https://www.lesswrong.com/posts/jXBmrEQj7zKGgiaYh/a-defense-of-gradual-disempowerment).
