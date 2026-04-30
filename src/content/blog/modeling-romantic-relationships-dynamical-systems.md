---
title: "Modeling Romantic Relationships With Dynamical Systems"
description: "A personal, math-informed post on whether romantic relationships can be understood as dynamical systems: feedback loops, attractors, repair, conflict, and why prediction is harder than it sounds."
pubDate: "2025-05-21"
author: "Mranmay Shetty"
tags:
  - relationships
  - dynamical-systems
  - mathematics
  - psychology
  - complex-systems
---

I thought of looking into this for a very personal reason: I often find people hard to understand in general, and I usually approach things from a logical point of view rather than an emotional one. I am also 25, trained more like an engineer / AI person, and now moving deeper into neuroscience, so my natural instinct is to ask whether something complicated can be described as a system.

That does not mean I think people are machines. I do not think love can be reduced to a few equations. But I was curious about a narrower question:

**Has anyone tried to quantify the variables in romantic relationships and model them using dynamical systems?**

By “dynamical systems,” I mean the kind of mathematical language used to describe things that evolve over time: neurons, populations, ecosystems, weather, control systems, and feedback loops. A romantic relationship also evolves over time. There are states, perturbations, recoveries, spirals, and sometimes sudden transitions. One argument disappears by dinner. Another argument changes the entire relationship. One couple fights often but repairs quickly. Another couple barely fights but slowly drifts apart.

That sounds very dynamical.

So I went down this rabbit hole. What I found is not a clean “physics of love,” but something more interesting: people really have tried to model romantic relationships mathematically. Some models are toy models, some are surprisingly serious, and some use actual couple-interaction data.

The main lesson I took away is this:

**Relationships are probably not predictable in the way planets are predictable, but parts of relationship dynamics can be modeled if we focus on feedback, repair, emotional inertia, and attractors instead of trying to model “love” as one magical variable.**

---

## The basic idea: a relationship is not a static object

A lot of everyday relationship language is static. We say people are “compatible,” “avoidant,” “anxious,” “toxic,” “secure,” “emotionally unavailable,” or “good together.” These labels can be useful, but they hide the most important part: relationships happen in time.

A relationship is not just two personalities sitting next to each other. It is two people continuously changing each other.

One person’s stress changes the other person’s mood. One person’s silence increases the other person’s anxiety. One person’s reassurance calms the other person down. One person’s criticism creates defensiveness, which creates more criticism. Sometimes the loop damps itself out. Sometimes it amplifies.

That is exactly the kind of thing dynamical systems are good at describing.

In the most abstract form, I can imagine a relationship state as some hidden vector:

$$
z(t)=
\begin{pmatrix}
\text{affection} \\
\text{trust} \\
\text{resentment} \\
\text{stress} \\
\text{commitment}
\end{pmatrix}
$$

The relationship changes according to some rule:

$$
\frac{dz}{dt}=f(z(t),u(t),\theta)
$$

Here, $z(t)$ is the current state, $u(t)$ represents external inputs like distance, work stress, illness, money, family pressure, or life transitions, and $\theta$ represents more stable parameters of the couple: how reactive they are, how quickly they repair, how much they influence each other, how much negativity they tolerate before responding.

Obviously, this is not something we can measure perfectly. I cannot open a person’s mind and read “trust = 0.73.” But this framing is already useful because it turns the vague question “is this relationship good?” into more precise questions:

- When something bad happens, does the system recover?
- Does one partner’s anxiety amplify the other partner’s withdrawal?
- Are there stable states the couple keeps returning to?
- Is the relationship near a tipping point?
- Does conflict lead to repair, avoidance, or escalation?

That is the lens I found useful.

---

## The famous toy model: Romeo and Juliet

The classic starting point is Steven Strogatz’s “Romeo and Juliet” model. In the simplest version, Romeo’s feelings and Juliet’s feelings are represented by two variables. Let $R(t)$ be Romeo’s love for Juliet and $J(t)$ be Juliet’s love for Romeo. Positive values mean love, negative values mean dislike or hate.

A simple linear model is:

$$
\frac{dR}{dt}=aR+bJ
$$

$$
\frac{dJ}{dt}=cR+dJ
$$

The parameters decide the “romantic style” of each person. For example, $b>0$ means Romeo warms up when Juliet loves him. But $b<0$ means Romeo backs away when Juliet loves him. Similarly, $a>0$ means Romeo reinforces his own feelings, while $a<0$ means his feelings naturally fade unless something sustains them.

In matrix form:

$$
\frac{d}{dt}
\begin{pmatrix}
R \\
J
\end{pmatrix}
=
\begin{pmatrix}
a & b \\
c & d
\end{pmatrix}
\begin{pmatrix}
R \\
J
\end{pmatrix}
$$

The behavior of this system is controlled by the eigenvalues of the matrix:

$$
\lambda_{\pm}
=
\frac{(a+d)\pm\sqrt{(a-d)^2+4bc}}{2}
$$

This is where the model becomes more than a joke. Depending on the parameters, the relationship can move toward apathy, spiral outward, oscillate, or get pulled toward one of several directions.

A particularly funny case is when Romeo reacts only to Juliet and Juliet reacts only to Romeo:

$$
\frac{dR}{dt}=-aJ
$$

$$
\frac{dJ}{dt}=bR
$$

Differentiate the first equation once more:

$$
\frac{d^2R}{dt^2}+abR=0
$$

That is the equation for a harmonic oscillator. In plain English: Romeo and Juliet cycle forever. One warms up, the other responds, the first cools down, the other reacts again, and the system keeps rotating.

Is this a realistic model of love? No. But it shows something important: **cyclic relationship patterns can emerge from feedback rules even when nobody is “trying” to create a cycle.**

This is the first useful idea.

A relationship pattern is not always caused by one person being irrational. Sometimes the loop itself creates the pattern.

---

## But “love” is not one variable

The immediate problem is obvious: what exactly is $R(t)$?

Is it attraction? Attachment? Sexual desire? Trust? Warmth? Obsession? Safety? Commitment? Familiarity? Dependency? All of these can move differently.

This is one of the biggest limitations of the toy models. They often treat love as a single number. But real romantic experience is not one-dimensional.

I can imagine liking someone but not trusting them. I can feel attached but not calm. Someone can be attractive but unsafe. A relationship can be intense and still unstable. Another can be less intense but much healthier.

So the first serious correction is: **the variable matters.**

If we model the wrong thing, even perfect math is useless.

That is why I found the later models more interesting when they moved away from “love” as one scalar and toward specific mechanisms: appeal, forgetting, partner influence, emotional inertia, negativity thresholds, and repair.

---

## Adding appeal, memory, and forgetting

Sergio Rinaldi and collaborators developed a line of models usually called “love dynamics.” These models are still simplified, but they add a more realistic idea: feelings do not only depend on the other person’s feelings. They also depend on appeal and forgetting.

A simplified version looks like this:

$$
\frac{dx_1}{dt}
=
-\alpha_1x_1+\beta_1x_2+\gamma_1A_2
$$

$$
\frac{dx_2}{dt}
=
-\alpha_2x_2+\beta_2x_1+\gamma_2A_1
$$

Here, $x_1$ is person 1’s feeling toward person 2, and $x_2$ is person 2’s feeling toward person 1.

The terms have a nice interpretation:

- $-\alpha_1x_1$ is forgetting or emotional decay.
- $\beta_1x_2$ is person 1 reacting to being loved by person 2.
- $\gamma_1A_2$ is person 1 reacting to person 2’s appeal.

This already feels more realistic. Feelings can grow from indifference because someone is appealing, not just because they love us back. Feelings can also fade unless sustained.

The equilibrium is found by setting both derivatives to zero. In the symmetric-looking linear case, the stability depends on whether emotional damping is stronger than mutual amplification:

$$
\alpha_1\alpha_2>\beta_1\beta_2
$$

This inequality is simple but psychologically interesting.

If the left side is bigger, forgetting / damping dominates. The system can settle. If the right side is too large, mutual reactivity dominates, and the system can become unstable.

That sounds surprisingly human. A relationship does not need zero emotion to be stable. It needs enough emotional damping so that every small perturbation does not explode.

In my own words: **intensity is not the same as stability.**

---

## Attractors: the concept that made the most sense to me

The concept I found most useful is the attractor.

An attractor is a state the system tends to return to. In relationship terms, an attractor could be closeness, chronic conflict, emotional distance, anxious pursuit, or calm companionship.

For example, imagine relationship satisfaction $s(t)$ obeys:

$$
\frac{ds}{dt}=-k(s-s^\ast)
$$

Here, $s^\ast$ is the baseline state the relationship returns to, and $k$ is the recovery rate. If something bad happens, $s(t)$ drops. But if $k>0$, it gradually returns:

$$
s(t)=s^\ast+(s(0)-s^\ast)e^{-kt}
$$

That is basically a toy model of repair.

A couple has a bad conversation, satisfaction drops, but the relationship returns to baseline. Some couples return quickly. Some return slowly. Some never fully return.

That alone is useful. It suggests that a relationship should not only be judged by whether conflict happens. Conflict happens in basically every real relationship. The more important question is:

**What does the system do after conflict?**

Does it repair? Does it avoid? Does it escalate? Does resentment accumulate?

This also explains why two relationships can look similar from the outside but be very different dynamically. Two couples may both argue once a week. But in one couple, arguments are perturbations around a stable affectionate state. In another, arguments push the system deeper into a negative attractor.

Same frequency of conflict. Different dynamics.

---

## Basins of attraction: why some fights change everything

The next useful idea is the basin of attraction.

A basin of attraction is the set of starting points that eventually flow to the same attractor. Imagine a landscape with two valleys. A ball placed on one side rolls into one valley; a ball placed on the other side rolls into the other.

For relationships, one valley might be trust and repair. Another might be suspicion and resentment.

A small argument inside the “trust basin” may not matter much. The relationship rolls back to safety. But if the system is already near the boundary, the same argument can push it into a different basin.

This is the mathematical version of something people say informally: “After that, things were never the same.”

In dynamical language, a relationship can cross a separatrix — a boundary between basins.

That does not mean the relationship is doomed. But it means the system has moved into a region where the default flow is different. Repair now requires more work because the old attractor is no longer the easiest place to return to.

This framing makes a lot of emotional experiences sound less mysterious. Sometimes the issue is not the event itself. It is the state of the system when the event happens.

---

## The serious empirical part: Gottman’s marital conflict models

The most serious work I found was not the Romeo-and-Juliet model. It was the work by John Gottman, Catherine Swanson, and James Murray on marital interaction.

Their models were not about abstract “love.” They modeled real couple interactions, especially conflict conversations, using nonlinear difference equations.

The basic form is:

$$
W_{t+1}=a+r_1W_t+I_{HW}(H_t)
$$

$$
H_{t+1}=b+r_2H_t+I_{WH}(W_t)
$$

Here, $W_t$ is the wife’s affective state at time $t$, and $H_t$ is the husband’s affective state at time $t$. The variables were based on coded interaction data: positive and negative behaviors during conversation.

The terms are very interpretable:

- $a$ and $b$ are baseline tendencies.
- $r_1W_t$ and $r_2H_t$ are emotional inertia.
- $I_{HW}(H_t)$ is the husband’s influence on the wife.
- $I_{WH}(W_t)$ is the wife’s influence on the husband.

This is much more grounded than the toy models because the variables are measured from actual interaction.

The part I like most is the separation between what each person brings into the conversation and what the interaction does once it begins. In normal language, we often mix these together. We say someone is “negative” or “reactive.” But the model asks something more precise:

- What is your baseline state before influence?
- How much does your previous state carry over?
- How strongly does your partner’s state move you?
- At what level of negativity do you start responding?

That is a very systems-level way to think about conflict.

Gottman and colleagues reported that parameters from these models predicted divorce in a sample of newlywed couples. The parameters included uninfluenced steady states, emotional inertia, influenced steady states, and influence functions. The paper also emphasized that the model separates what each person brings into the interaction from where the interaction goes once mutual influence starts.

This is not “one equation predicts love.” It is more specific: **certain interaction dynamics carry information about relationship stability.**

That distinction matters.

---

## The most human parameter: the negativity threshold

The most interesting parameter to me is the negative threshold.

In the Gottman model, the influence function can have thresholds. In simple terms, one partner’s negativity may not affect the other partner until it passes some level. A low threshold means the partner responds to small negativity. A high threshold means the partner does not respond until things get very negative.

At first, I would have guessed that tolerating more negativity is a good thing. Maybe it means patience. Maybe it means emotional maturity. But Gottman’s interpretation is more subtle.

If the negativity threshold is too high, the couple may be adapting to negativity instead of repairing it. They let small things slide until they become big things.

The model suggests that healthier couples may notice and respond to negativity earlier — not necessarily by escalating, but by repairing before the system drifts too far.

That really clicked for me.

In control-systems terms, delayed feedback can make a system unstable. If the controller waits too long before correcting the error, the deviation grows. By the time the system responds, the correction has to be much larger.

In relationship terms: if resentment is allowed to accumulate silently, the eventual repair problem becomes much harder.

So one possible takeaway is:

**A stable relationship is not one where negativity is ignored. It may be one where negativity is detected early enough to be repaired.**

That feels both mathematical and very practical.

---

## Why repair is more important than no conflict

One mistake I used to make when thinking logically about relationships is imagining that fewer conflicts automatically means a better system.

But dynamical systems suggest a different view.

A system can have perturbations and still be stable. In fact, biological systems are constantly perturbed. Neurons fluctuate, bodies experience stress, ecosystems change, and yet stability comes from regulation, not from the absence of disturbance.

So for relationships, the better question may be:

**What are the repair dynamics?**

If a couple has a disagreement, does the system move back toward warmth? Or does it stay displaced? Does one partner’s repair attempt reduce tension? Or does it fail? Does apology actually change the trajectory? Or does the system return to the same negative loop?

A simple repair model might look like:

$$
\frac{dn}{dt}=g(n)-r(t)
$$

where $n(t)$ is negativity and $r(t)$ is repair. If repair is strong enough, negativity decays. If repair is weak or delayed, negativity accumulates.

Of course, real repair is not one variable. It includes timing, sincerity, safety, tone, memory, attachment, and the history of previous repairs. But as a concept, repair is a dynamical force. It changes the trajectory.

This is probably the most useful idea in the whole topic for a general audience: **do not only ask how much conflict exists; ask whether the system can repair itself.**

---

## Emotional inertia: why moods carry over

Another parameter I liked is emotional inertia.

In a dynamical model, inertia means the current state depends on the previous state. If someone is negative now, they are more likely to remain negative at the next time step.

That can be written simply as:

$$
x_{t+1}=rx_t+\text{other influences}
$$

If $r$ is close to zero, the state changes easily. If $r$ is close to one, the state is sticky.

Psychologically, this maps onto something obvious but important: some people recover quickly, while others stay in a state for a long time. Some conversations reset quickly. Others have emotional momentum.

In relationships, two inertias interact. If both people have high negative inertia, conflict can become sticky. If one person has high inertia and the other is highly reactive, the system can become asymmetric: one person remains upset, the other keeps responding to that upset, and the loop sustains itself.

This is where the math helps me because it stops the conversation from becoming moralistic. Instead of saying “this person is bad at relationships,” I can ask:

**What is the recovery time constant of this emotional system?**

That sounds cold, but it is actually useful. It turns blame into mechanism.

---

## Co-regulation: when two nervous systems become coupled

The relationship literature also connects to something I care about from neuroscience: regulation.

A relationship is not only two minds exchanging sentences. It is also two nervous systems influencing each other. Heart rate, breathing, stress responses, facial expressions, posture, and voice all become part of the loop.

A simple co-regulation model might be:

$$
\frac{dx}{dt}=a_1(x^\ast-x)+a_2(y-x)
$$

$$
\frac{dy}{dt}=b_1(y^\ast-y)+b_2(x-y)
$$

Here, $x$ and $y$ could be emotional arousal levels for two partners. The first term pulls each person back toward their own baseline. The second term couples them to the other person.

If $a_2$ and $b_2$ are positive, the partners tend to move toward each other’s states. That can be good or bad. If one person is calm, the other may calm down. But if one person is stressed, stress can also spread.

That is why synchrony is not automatically good. Two people can synchronize into calm, but they can also synchronize into panic, anger, or avoidance.

This is where relationship dynamics start to look very close to neuroscience. Brains and bodies are coupled regulatory systems. A romantic relationship is not just a story people tell about each other. It is also a biological feedback loop.

---

## Why prediction is possible, but only in a limited way

The tempting question is: can we predict whether a relationship will succeed or fail?

After reading this literature, my answer would be:

**Sometimes locally, rarely universally.**

We may be able to predict short-term interaction trajectories. For example, given a conflict conversation, can we estimate whether it will escalate or repair? That seems plausible.

We may also be able to estimate risk from repeated patterns: negative baseline, high emotional inertia, strong negative influence, poor repair, high negativity threshold, and so on.

But predicting the full fate of a relationship is much harder. Relationships are not closed systems. They are affected by illness, distance, money, family, career changes, maturity, trauma, timing, social support, and random life events. People also learn. Their parameters are not fixed forever.

This is why I do not think the right goal is a “relationship prediction machine.”

A better goal is to identify dynamical patterns:

- Is the relationship self-correcting?
- Does conflict amplify or damp out?
- Are there positive attractors?
- Are repair attempts effective?
- Is the system becoming more rigid over time?
- Are small perturbations producing large reactions?

That is already a lot.

It is less like predicting destiny and more like understanding stability.

---

## The biggest limitation: measuring the hidden variables

The biggest scientific problem is measurement.

In physics, if I model a pendulum, I can measure angle and velocity. In relationships, the variables are hidden. Trust, affection, resentment, fear, and commitment are not directly observable.

We can measure proxies: self-reports, conversation coding, physiological signals, text timing, facial expression, or daily ratings. But every proxy is imperfect.

This creates a huge risk: the model may look precise while the variables are fuzzy.

For example, suppose I model “love” as $x(t)$. What exactly am I measuring? A daily rating? A behavior? A physiological response? A statement? A memory? A social-media interaction?

This is why I think the best models are the modest ones. They do not try to model all of love. They model something narrower and measurable: positivity versus negativity in conversation, physiological arousal, daily affect, conflict recovery, or perceived responsiveness.

In engineering terms: if the signal is badly defined, the model output is not meaningful.

---

## What I personally took from this

I started with a very naive-sounding question: can romantic relationships be modeled mathematically?

I now think the answer is yes, but only if we are careful about what we mean.

No, there is no equation that captures love. No, a relationship cannot be reduced to two variables. No, dynamical systems will not make people easy to understand.

But yes, the language of dynamical systems is useful.

It gives names to patterns that otherwise feel vague:

- **Feedback**: my state changes your state, and your state changes mine.
- **Inertia**: emotional states carry over.
- **Attractors**: couples return to certain patterns.
- **Basins**: the same event can have different outcomes depending on where the system already is.
- **Thresholds**: people respond only after signals become strong enough.
- **Repair**: stability depends on recovery, not the absence of perturbation.
- **Coupling**: two people can regulate or dysregulate each other.

As someone who often understands the world better through systems than through pure emotional intuition, I found this comforting. Not because it makes relationships simple, but because it makes some of the complexity legible.

Maybe the point of mathematics here is not to reduce love. Maybe it is to give us a cleaner language for patterns we already feel but cannot easily describe.

The most useful conclusion for me is this:

**A relationship is not just about how two people feel. It is about how those feelings evolve together over time.**

That is the dynamical systems view.

And honestly, that feels like a pretty good way to think about it.

---

## Sources I looked at

- Steven H. Strogatz, “Love Affairs and Differential Equations,” *Mathematics Magazine*, 1988.
- J. C. Sprott, “Dynamical Models of Love,” *Nonlinear Dynamics, Psychology, and Life Sciences*, 2004.
- Sergio Rinaldi, “Love Dynamics: The Case of Linear Couples,” *Applied Mathematics and Computation*, 1998.
- Sergio Rinaldi, “Laura and Petrarch: An Intriguing Case of Cyclical Love Dynamics,” *SIAM Journal on Applied Mathematics*, 1998.
- Sergio Rinaldi, Fabio Della Rossa, Fabio Dercole, Alessandro Gragnani, and Pietro Landi, “Love and Appeal in Standard Couples,” *International Journal of Bifurcation and Chaos*, 2010.
- John Gottman, Catherine Swanson, and James Murray, “The Mathematics of Marital Conflict: Dynamic Mathematical Nonlinear Modeling of Newlywed Marital Interaction,” *Journal of Family Psychology*, 1999.
- John Gottman, James Murray, Catherine Swanson, Rebecca Tyson, and Kristin Swanson, *The Mathematics of Marriage: Dynamic Nonlinear Models*, MIT Press.
- Emilio Ferrer and Jonathan Helm, “Dynamical Systems Modeling of Physiological Coregulation in Dyadic Interactions,” *International Journal of Psychophysiology*, 2013.
- Jennifer Steele and Emilio Ferrer, “Latent Differential Equation Modeling of Self-Regulatory and Coregulatory Affective Processes,” *Multivariate Behavioral Research*, 2011.
