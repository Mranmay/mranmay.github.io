---
title: "Can Romantic Relationships Be Modeled as Dynamical Systems?"
description: "A personal, math-informed literature review on love, couple interaction, feedback loops, attractors, and the limits of predicting relationships."
pubDate: "2026-04-30"
author: "Mranmay Shetty"
tags:
  - dynamical systems
  - relationships
  - mathematical modeling
  - psychology
  - complex systems
---

I thought of looking into this for a very personal reason: I often find people hard to understand in general and mostly have a logical perspective to things rather than an emotional one. I was curious to see if anyone has developed or researched ways to quantify the variables in a relationship, especially romantic ones, and model them using dynamical systems methods. More bluntly: can we write equations for attraction, attachment, emotional feedback, conflict, repair, and long-term stability? And if we can, can those equations help predict whether a relationship will succeed or fail?

That question sounds slightly absurd at first. Love feels like the last thing that should fit inside mathematics. But the more I read, the more I realized that the question is not absurd at all. There is a surprisingly serious literature on this. Some of it is playful and theoretical, like the famous Romeo-and-Juliet differential-equation models. Some of it is much more empirical, like John Gottman and James Murray’s nonlinear models of marital conflict. And some of it is modern and data-driven, using dyadic time series, affect dynamics, physiological co-regulation, and state-space models.

My conclusion is not that love can be “reduced” to equations. That would be both scientifically naive and personally unconvincing. But dynamical systems do offer a useful language for thinking about relationships: not as static labels like “good” or “bad,” but as evolving systems with feedback loops, inertia, attractors, tipping points, and noise. A relationship is not just a collection of two personalities. It is also a coupled process.

That idea is what this essay is about.

---

## 1. Why dynamical systems are a tempting language for relationships

In many everyday explanations of relationships, we use static language. We say that two people are compatible, incompatible, anxious, avoidant, communicative, toxic, supportive, emotionally unavailable, or securely attached. Those descriptions can be useful, but they miss something important: relationships unfold in time.

A couple can be fine at breakfast, tense by afternoon, distant by evening, and repaired by night. A small comment can escalate into conflict in one couple but dissolve harmlessly in another. One partner’s anxiety can trigger the other’s withdrawal, which then increases the first partner’s anxiety. A relationship can remain stable for years, then suddenly destabilize after a major life event. These are not simply “traits.” They are temporal patterns.

That is exactly the kind of thing dynamical systems are designed to describe.

A very general dynamical model looks like this:

$$
\frac{dz}{dt} = f(z(t), u(t), \theta) + \omega(t)
$$

Here, $z(t)$ is the state of the system at time $t$. In a relationship, this state might include affection, resentment, trust, attraction, emotional arousal, attachment security, stress, or satisfaction. The function $f$ describes how the state changes over time. The term $u(t)$ represents external inputs: stress, distance, work, illness, family pressure, finances, or major life events. The parameters $\theta$ represent stable features of the system, such as emotional reactivity or recovery speed. The term $\omega(t)$ represents random shocks and unmodeled influences.

But in real life we rarely observe $z(t)$ directly. We observe behavior, words, self-reports, physiological signals, or outcomes. So the observation model might be written as:

$$
y_t = g(z(t)) + \varepsilon_t
$$

where $y_t$ is the measured data and $\varepsilon_t$ is measurement noise.

This distinction between the hidden state and the observed signal is important. A person may say “I’m fine,” but their physiological arousal, tone, avoidance, or later behavior may suggest a different internal state. A couple may report being happy, but their conflict dynamics might show unstable feedback. Conversely, a couple may argue intensely but repair quickly, which may be dynamically healthier than quiet emotional disengagement.

So the dynamical-systems question is not simply: “Are they happy?” It is:

- How does each partner’s state evolve?
- How does one partner influence the other?
- Does the system return to equilibrium after perturbation?
- Are there multiple stable states?
- Are there thresholds after which conflict escalates?
- Can small events push the relationship into a different basin of attraction?
- Which variables are measurable, and which are hidden?

That is already a more precise way of thinking than ordinary relationship language.

---

## 2. The classic toy models: Romeo, Juliet, and differential equations

The simplest and most famous entry point is Steven Strogatz’s 1988 note, *Love Affairs and Differential Equations*. Strogatz used a fictional Romeo-and-Juliet setup to show how ordinary differential equations could model romantic feelings. The model was playful, but it became influential because it translated emotional dynamics into phase portraits, equilibria, and oscillations.

Let $R(t)$ be Romeo’s feeling toward Juliet and $J(t)$ be Juliet’s feeling toward Romeo. Positive values mean love; negative values mean dislike or hate. A very simple model is:

$$
\frac{dR}{dt} = aR + bJ
$$

$$
\frac{dJ}{dt} = cR + dJ
$$

The parameters have intuitive meanings:

- $a$: Romeo’s response to his own current feeling.
- $b$: Romeo’s response to Juliet’s feeling.
- $c$: Juliet’s response to Romeo’s feeling.
- $d$: Juliet’s response to her own current feeling.

For example, if $b > 0$, Romeo is encouraged by Juliet’s love. If $b < 0$, Romeo is repelled by Juliet’s love. If $a > 0$, Romeo reinforces his own emotions; if $a < 0$, his feelings naturally decay.

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

The dynamics are controlled by the eigenvalues of the matrix:

$$
A =
\begin{pmatrix}
a & b \\
c & d
\end{pmatrix}
$$

Those eigenvalues are:

$$
\lambda_{\pm}
=
\frac{(a+d) \pm \sqrt{(a+d)^2 - 4(ad-bc)}}{2}
$$

This is where the model becomes mathematically interesting. The signs and magnitudes of the parameters determine whether the relationship converges, diverges, oscillates, or becomes unstable.

If the eigenvalues are negative, feelings decay toward neutrality. If they are positive, feelings grow without bound, which is psychologically unrealistic but mathematically clear. If the eigenvalues are complex with negative real part, the couple spirals toward equilibrium. If they are complex with zero real part, the system cycles forever. If one eigenvalue is positive and the other negative, the equilibrium is a saddle: some initial conditions move toward neutrality, while others diverge away.

A famous version is:

$$
\frac{dR}{dt} = -aJ
$$

$$
\frac{dJ}{dt} = bR
$$

with $a,b>0$. Differentiating the first equation gives:

$$
\frac{d^2R}{dt^2} = -a \frac{dJ}{dt} = -abR
$$

so:

$$
\frac{d^2R}{dt^2} + abR = 0
$$

This is the equation for a harmonic oscillator. The feelings cycle endlessly. Romeo’s love rises, Juliet responds, Romeo pulls away, Juliet cools down, Romeo warms again, and so on.

The model is obviously too simple for real relationships, but it teaches an important point: even very simple feedback rules can generate nontrivial emotional trajectories. A relationship can oscillate not because either person is irrational, but because the coupling rules create oscillation.

J. C. Sprott later extended these models in *Dynamical Models of Love*. Sprott considered different “romantic styles” based on parameter signs: people who are encouraged by love, repelled by it, self-reinforcing, self-damping, cautious, avoidant, or reactive. He also considered love triangles and nonlinear extensions, showing that sufficiently nonlinear romantic systems can even produce chaotic dynamics.

The important lesson is not that real love is literally a two-variable linear system. It is that relationship patterns can arise from feedback structure. In that sense, the model is less a prediction engine and more a conceptual microscope.

---

## 3. Rinaldi’s “love dynamics”: appeal, forgetting, and stable romance

The Strogatz model is elegant, but it has a major limitation: it does not include attraction or appeal. It only describes how each person reacts to the other’s feelings. Sergio Rinaldi’s work on love dynamics tried to make the models more psychologically realistic by adding variables such as appeal, forgetting, and reaction to being loved.

A representative linear model is:

$$
\frac{dx_1}{dt}
=
-a_1x_1 + \beta_1x_2 + \gamma_1A_2
$$

$$
\frac{dx_2}{dt}
=
-a_2x_2 + \beta_2x_1 + \gamma_2A_1
$$

Here:

- $x_1(t)$ is person 1’s feeling toward person 2.
- $x_2(t)$ is person 2’s feeling toward person 1.
- $a_i > 0$ is forgetting or emotional decay.
- $\beta_i$ is reactivity to being loved.
- $A_i$ is appeal.
- $\gamma_i$ measures sensitivity to appeal.

This is already more plausible. Feelings do not grow only because someone loves us; they can also grow because the person has traits we find appealing. At the same time, feelings decay unless reinforced.

The equilibrium is obtained by setting both derivatives to zero:

$$
0 =
-a_1x_1^\ast + \beta_1x_2^\ast + \gamma_1A_2
$$

$$
0 =
-a_2x_2^\ast + \beta_2x_1^\ast + \gamma_2A_1
$$

Solving gives:

$$
x_1^\ast =
\frac{a_2\gamma_1A_2 + \beta_1\gamma_2A_1}
{a_1a_2 - \beta_1\beta_2}
$$

$$
x_2^\ast =
\frac{a_1\gamma_2A_1 + \beta_2\gamma_1A_2}
{a_1a_2 - \beta_1\beta_2}
$$

A key stability condition is:

$$
a_1a_2 > \beta_1\beta_2
$$

This means that the product of forgetting rates must exceed the product of mutual reactivity. In ordinary language: if emotional reactivity is too strong relative to emotional decay, the system can become unstable. If forgetting or damping is strong enough, the relationship settles.

This is one of the first places where the mathematics feels psychologically meaningful. A stable relationship is not necessarily one with no emotion. It may be one where emotional feedback is strong enough to sustain affection but not so strong that every fluctuation becomes explosive.

Rinaldi and collaborators later introduced nonlinear reaction functions. Instead of assuming that love grows linearly with the partner’s love, they used bounded functions:

$$
\frac{dx_1}{dt}
=
-\alpha_1x_1 + R_1(x_2) + A_2
$$

$$
\frac{dx_2}{dt}
=
-\alpha_2x_2 + R_2(x_1) + A_1
$$

where $R_1$ and $R_2$ are reaction functions. These functions can saturate: after some point, more love from the partner does not produce an indefinitely larger response. That is more realistic than a linear model.

A central concept in this work is the distinction between robust and fragile couples. A robust couple has one stable equilibrium. If disturbed, the system returns to its long-term state. A fragile couple can have two stable equilibria separated by an unstable saddle point. In that case, the same couple may have both a “good” attractor and a “bad” attractor.

This is where the idea of a basin of attraction becomes powerful.

If the state of the relationship is inside the basin of the good attractor, small conflicts may occur but the couple eventually returns to affection. If a shock pushes the system across a boundary, the same couple may fall into a low-quality equilibrium. In everyday language, this is the difference between “we had a bad week but recovered” and “something changed and we never really came back.”

Mathematically, the basin boundary is often associated with the stable manifold of a saddle point. Conceptually, it is a tipping boundary.

That is a surprisingly useful way to think about relationships.

---

## 4. What counts as a “variable” in a romantic relationship?

Before going further, there is an important problem: what exactly are we modeling?

In physics, the variables are often clear: position, velocity, mass, charge, temperature. In relationships, the variables are not obvious. “Love” is not a directly measurable scalar. Neither are trust, attraction, resentment, commitment, attachment security, or emotional safety.

A dynamical model forces us to make choices. Possible state variables include:

$$
x(t) = \text{affection}
$$

$$
r(t) = \text{resentment}
$$

$$
s(t) = \text{relationship satisfaction}
$$

$$
a(t) = \text{attachment anxiety}
$$

$$
v(t) = \text{avoidance or withdrawal}
$$

$$
p(t) = \text{physiological arousal}
$$

$$
c(t) = \text{commitment}
$$

$$
q(t) = \text{perceived partner responsiveness}
$$

But most of these are latent variables. We infer them from observations:

$$
y_t =
\text{survey score, facial expression, tone, text behavior, physiology, or coded interaction}
$$

This leads to a measurement problem. If I say a person’s trust is $0.7$, what does that mean? Is it from a questionnaire? A behavioral task? A neural or physiological proxy? A self-report? A partner report? A model estimate?

This is why the strongest empirical work does not usually model “love” directly. It models observable processes: affect during conflict, positivity and negativity, heart rate, respiration, emotional linkage, daily self-reported affect, or relationship satisfaction over time. The more abstract the variable, the harder the model is to validate.

A careful model should therefore distinguish:

$$
\text{latent relationship state}
\neq
\text{observed measurement}
$$

That distinction is central to modern state-space models, which I discuss later.

---

## 5. Gottman and Murray: from toy love equations to marital conflict data

The most empirically serious branch of this literature comes from John Gottman, James Murray, Catherine Swanson, Rebecca Tyson, and collaborators. Their work modeled marital interaction using nonlinear difference equations.

This is different from the Romeo-and-Juliet models in two ways. First, it used real couple interaction data. Second, it modeled observable affect during interaction rather than abstract “love.”

A simplified version of their model is:

$$
W_{t+1} = a + r_1W_t + I_{HW}(H_t)
$$

$$
H_{t+1} = b + r_2H_t + I_{WH}(W_t)
$$

Here:

- $W_t$ is the wife’s affective state at time $t$.
- $H_t$ is the husband’s affective state at time $t$.
- $a$ and $b$ represent uninfluenced emotional set points.
- $r_1$ and $r_2$ represent emotional inertia.
- $I_{HW}(H_t)$ is the influence of the husband’s state on the wife.
- $I_{WH}(W_t)$ is the influence of the wife’s state on the husband.

This structure is powerful because it separates baseline emotional tendency from partner influence. A person may have a generally positive set point but still be strongly pulled downward by a partner’s negativity. Or a person may have a negative set point but be stabilized by a partner’s positive influence.

If the influence functions are approximately linear near an equilibrium, we can write:

$$
I_{HW}(H_t) \approx k_{HW}H_t
$$

$$
I_{WH}(W_t) \approx k_{WH}W_t
$$

Then:

$$
\begin{pmatrix}
W_{t+1} \\
H_{t+1}
\end{pmatrix}
=
\begin{pmatrix}
a \\
b
\end{pmatrix}
+
\begin{pmatrix}
r_1 & k_{HW} \\
k_{WH} & r_2
\end{pmatrix}
\begin{pmatrix}
W_t \\
H_t
\end{pmatrix}
$$

For a discrete-time system, local stability requires the eigenvalues of the matrix

$$
M =
\begin{pmatrix}
r_1 & k_{HW} \\
k_{WH} & r_2
\end{pmatrix}
$$

to lie inside the unit circle:

$$
|\lambda_i(M)| < 1
$$

If the eigenvalues are too large in magnitude, the interaction does not settle. It may escalate, oscillate, or become unstable.

This model introduced several important concepts into relationship modeling:

1. **Uninfluenced steady state**: where a person tends to be emotionally without partner influence.
2. **Influenced steady state**: where the couple actually settles after mutual influence.
3. **Influence function**: how one partner’s affect changes the other partner’s next state.
4. **Thresholds**: levels of negativity or positivity needed before a partner reacts strongly.
5. **Attractors**: stable emotional states toward which conversations move.

The Gottman-Murray line of work is important because it made a concrete claim: dynamic parameters estimated from interaction data can help predict marital stability or divorce. The model was not just metaphorical. It was fitted to observed interaction sequences.

That said, it is worth being cautious. These models do not mean that divorce can be predicted with perfect certainty, nor that a universal equation can diagnose every relationship. The data came from particular lab settings, particular coding schemes, and particular populations. But as a proof of concept, this work is very important: it showed that relationship outcomes can be linked to the structure of interaction dynamics, not just static compatibility scores.

To me, this is one of the most interesting ideas in the entire literature. A relationship may fail not simply because conflict exists, but because conflict has a particular dynamical form: negativity triggers defensiveness, defensiveness triggers withdrawal, withdrawal triggers pursuit, pursuit triggers more negativity, and the loop becomes self-reinforcing.

In dynamical language:

$$
\text{conflict} \rightarrow \text{partner response} \rightarrow \text{amplification} \rightarrow \text{new conflict state}
$$

A good relationship may not be one without perturbations. It may be one with strong repair dynamics.

---

## 6. Attractors, repair, and the mathematics of “coming back”

One of the most useful concepts from dynamical systems is the attractor.

An attractor is a state or pattern toward which a system tends to evolve. In relationship terms, an attractor might be emotional closeness, chronic conflict, mutual avoidance, anxious pursuit, or stable companionship.

Suppose we model relationship satisfaction $s(t)$ with a simple one-dimensional equation:

$$
\frac{ds}{dt} = -k(s - s^\ast)
$$

Here, $s^\ast$ is the stable equilibrium and $k>0$ is the recovery rate. If $s(t)$ is perturbed away from $s^\ast$, it returns exponentially:

$$
s(t) = s^\ast + (s(0)-s^\ast)e^{-kt}
$$

This is a simple model of repair. A couple has conflict, satisfaction drops, but the system returns to baseline. The parameter $k$ tells us how quickly repair happens. A high $k$ means fast recovery. A low $k$ means slow recovery.

But some systems may have more than one attractor. A simple way to represent this is with a potential function $V(s)$, where the dynamics follow:

$$
\frac{ds}{dt} = -\frac{dV}{ds}
$$

If $V(s)$ has one valley, the system has one attractor. If $V(s)$ has two valleys, the system has two attractors. One valley might represent a high-trust state, the other a low-trust state.

A major relational shock can push the system from one basin to another. After that, the couple may not return to the old equilibrium without active intervention.

This gives a mathematical interpretation of a familiar experience: sometimes an argument is just an argument; other times it changes the relationship. The difference is not necessarily the size of the event alone. It is where the event pushes the system relative to its basin boundaries.

---

## 7. Co-regulation: relationships as coupled emotional systems

The more modern literature often avoids the word “love” and instead studies emotional co-regulation. The basic idea is that partners regulate not only themselves but also each other.

A simple continuous-time co-regulation model is:

$$
\frac{dx}{dt} = a_1(x^\ast - x) + a_2(y - x)
$$

$$
\frac{dy}{dt} = b_1(y^\ast - y) + b_2(x - y)
$$

Here:

- $x(t)$ and $y(t)$ are the emotional states of the two partners.
- $x^\ast$ and $y^\ast$ are their preferred or baseline states.
- $a_1$ and $b_1$ describe self-regulation.
- $a_2$ and $b_2$ describe partner coupling.

The term $a_1(x^\ast-x)$ means person $x$ is pulled back toward their own baseline. The term $a_2(y-x)$ means they are also pulled toward or away from the partner’s state.

In matrix form:

$$
\frac{d}{dt}
\begin{pmatrix}
x \\
y
\end{pmatrix}
=
\begin{pmatrix}
-(a_1+a_2) & a_2 \\
b_2 & -(b_1+b_2)
\end{pmatrix}
\begin{pmatrix}
x \\
y
\end{pmatrix}
+
\begin{pmatrix}
a_1x^\ast \\
b_1y^\ast
\end{pmatrix}
$$

The stability of the system depends on the trace and determinant of the matrix. For a two-dimensional continuous system:

$$
\text{trace} < 0
$$

$$
\text{determinant} > 0
$$

are basic conditions for local stability.

The trace is:

$$
\text{tr} = -(a_1+a_2) - (b_1+b_2)
$$

The determinant is:

$$
\Delta = (a_1+a_2)(b_1+b_2) - a_2b_2
$$

The psychological interpretation is intuitive. If self-regulation is strong and coupling is not destabilizing, the system returns to equilibrium. If coupling amplifies deviations too strongly, the dyad can become unstable.

This is a cleaner way of saying something people often say informally: “We regulate each other.” But the equation forces precision. Do partners calm each other? Amplify each other? Synchronize? Pull away? Does one partner have more influence than the other? Are they mutually coupled or asymmetrically coupled?

Empirical work by Steele and Ferrer used latent differential equation models to study self-regulation and co-regulation of affect in romantic couples using daily reports of positive and negative affect. Ferrer and Helm applied dynamical models to physiological co-regulation, using heart rate and respiration data from couples. More recent work such as “Close TIES” extends this idea to physiological linkage using measures such as electrodermal activity and respiratory sinus arrhythmia.

What I find important here is that relationships are not only cognitive or verbal. They are embodied. Two people may become coupled in heart rate, respiration, arousal, posture, tone, and timing. Some of this coupling may be healthy; some may reflect stress contagion. A dynamical model gives us a way to ask which is which.

---

## 8. Oscillators: why some emotional patterns repeat

Many relationship patterns feel cyclical: closeness, tension, conflict, distance, longing, reunion, and then the cycle repeats. A natural mathematical object for such patterns is the oscillator.

A damped oscillator has the form:

$$
\frac{d^2x}{dt^2} + \zeta \frac{dx}{dt} + \omega^2 x = 0
$$

Here:

- $x(t)$ is deviation from equilibrium.
- $\zeta$ is damping.
- $\omega$ is natural frequency.

If $\zeta > 0$, oscillations decay. If $\zeta = 0$, they persist. If $\zeta < 0$, they amplify.

In a relationship context, $x(t)$ could represent emotional distance, negativity, desire, or insecurity. Damping corresponds to repair. Negative damping corresponds to amplification.

A coupled oscillator model might look like:

$$
\frac{d^2x_i}{dt^2}
=
\eta_i x_i
+
\zeta_i \frac{dx_i}{dt}
+
\gamma_i x_j
+
\delta_i \frac{dx_j}{dt}
+
\epsilon_i(t)
$$

Here, person $i$'s emotional acceleration depends on their own state, their own emotional velocity, the partner’s state, and the partner’s emotional velocity.

This sounds abstract, but it maps onto real questions:

- Does my partner’s distress increase my distress?
- Does my partner’s calm reduce my distress?
- Do I react more to their current state or to how fast their state is changing?
- Do we damp each other’s negativity or amplify it?

This kind of model is useful because it treats emotion not as a single score but as a trajectory.

---

## 9. State-space models: the hidden-state version of relationship dynamics

A major problem in relationship science is that the things we care about are often hidden. We do not directly observe trust, attachment security, resentment, or emotional safety. We observe proxies.

State-space models are useful because they separate the latent process from the measurement process.

A simple linear state-space model is:

$$
z_{t+1} = Az_t + Bu_t + \omega_t
$$

$$
y_t = Cz_t + \varepsilon_t
$$

Here:

- $z_t$ is the hidden relationship state.
- $y_t$ is what we observe.
- $A$ controls how the hidden state evolves.
- $B$ controls the effect of external inputs.
- $C$ maps hidden states to observed signals.
- $\omega_t$ is process noise.
- $\varepsilon_t$ is measurement noise.

For a couple, a simple hidden state could be:

$$
z_t =
\begin{pmatrix}
\text{partner 1 trust} \\
\text{partner 2 trust} \\
\text{conflict arousal} \\
\text{commitment}
\end{pmatrix}
$$

The observation vector could be:

$$
y_t =
\begin{pmatrix}
\text{daily satisfaction rating} \\
\text{text response latency} \\
\text{heart rate variability} \\
\text{coded negativity}
\end{pmatrix}
$$

This is much closer to how a serious predictive model would need to work. It would not simply say “love equals $x$.” It would infer hidden states from noisy observations.

This also reveals why prediction is difficult. If the observations are sparse, biased, or measured at the wrong time scale, many different hidden dynamics can explain the same data. This is the problem of identifiability.

---

## 10. Identifiability: the hidden problem behind romantic prediction

When people hear about mathematical models of relationships, they often jump to prediction. Can we predict breakup? Can we predict divorce? Can we predict whether someone is “right” for someone else?

The deeper question is: can we estimate the model at all?

A parameter is identifiable if the data contain enough information to recover it. In relationship models, this is difficult because many important variables are hidden and many observations are noisy.

For example, suppose a couple becomes distant. Possible explanations include:

- loss of attraction,
- external stress,
- avoidant attachment activation,
- unresolved resentment,
- depression,
- work pressure,
- conflict avoidance,
- a temporary need for space,
- measurement error.

Different internal mechanisms can produce similar outward behavior.

Mathematically, this means different parameter sets $\theta_1$ and $\theta_2$ may produce similar observed trajectories:

$$
p(y_{1:T}|\theta_1) \approx p(y_{1:T}|\theta_2)
$$

If that happens, the model may fit the data but still not reveal the true mechanism.

This is why dense time-series data are so important. A one-time questionnaire cannot identify a dynamical system. Even a few monthly measurements may be insufficient. To estimate feedback loops, delays, coupling, and recovery rates, we need repeated measurements over the relevant time scale.

And time scale matters. A conflict conversation unfolds second by second. Emotional recovery may unfold over hours. Relationship satisfaction may shift over weeks. Attachment patterns may evolve over years. A model built at the wrong time scale can miss the actual dynamics.

---

## 11. Prediction: what can realistically be predicted?

I think it is useful to distinguish four prediction targets.

### 1. Short-term interaction dynamics

This means predicting what happens next in a conversation: escalation, repair, withdrawal, or positivity. Gottman-style models are strongest here because they use sequential interaction data.

### 2. Daily emotional dynamics

This means predicting tomorrow’s affect, closeness, conflict, or satisfaction from today’s state. Diary and experience-sampling studies are useful here.

### 3. Medium-term relationship trajectories

This means predicting whether satisfaction improves, declines, or stabilizes over months. Dyadic longitudinal models, actor-partner interdependence models, and growth-curve models are more relevant here.

### 4. Long-term success or failure

This means predicting breakup, divorce, or long-term stability. This is the hardest target because the outcome depends on many external shocks, changing goals, life transitions, and unobserved variables.

A dynamical-systems approach is most convincing for the first three. For long-term fate, it can provide risk estimates, not certainty.

That distinction matters. A model might be very useful even if it cannot say, “This relationship will fail.” It may still say:

- this couple escalates quickly but repairs quickly,
- this couple has low conflict but also low positive coupling,
- this couple’s physiological linkage suggests stress contagion,
- this relationship has slow recovery after negative events,
- this dyad is near a tipping point after repeated perturbations.

That kind of prediction is less dramatic but more scientifically realistic.

---

## 12. What would a serious modern model look like?

If I were designing a serious model of romantic relationships, I would not start with one equation for “love.” I would build a multilevel latent dynamical system.

A simplified version could be:

$$
z_{t+1}^{(c)} =
A^{(c)}z_t^{(c)} + B^{(c)}u_t^{(c)} + \omega_t^{(c)}
$$

$$
y_t^{(c)} =
C^{(c)}z_t^{(c)} + \varepsilon_t^{(c)}
$$

where $c$ indexes the couple.

The couple-specific parameters could be drawn from a population distribution:

$$
A^{(c)} \sim \mathcal{N}(A_0, \Sigma_A)
$$

$$
B^{(c)} \sim \mathcal{N}(B_0, \Sigma_B)
$$

This would allow each couple to have its own dynamics while still learning from the population. That is important because couples are not identical. A model that assumes one universal set of parameters will probably fail.

The hidden state might include:

$$
z_t =
\begin{pmatrix}
\text{affection}_1 \\
\text{affection}_2 \\
\text{trust}_1 \\
\text{trust}_2 \\
\text{arousal}_1 \\
\text{arousal}_2 \\
\text{resentment} \\
\text{commitment}
\end{pmatrix}
$$

The inputs might include:

$$
u_t =
\begin{pmatrix}
\text{stress} \\
\text{distance} \\
\text{sleep} \\
\text{conflict event} \\
\text{positive shared event}
\end{pmatrix}
$$

The observations might include:

$$
y_t =
\begin{pmatrix}
\text{daily self-report} \\
\text{partner report} \\
\text{coded conversation affect} \\
\text{heart rate variability} \\
\text{message timing metadata}
\end{pmatrix}
$$

I would be very careful with passive sensing and phone data. The point should not be surveillance. If such data were used at all, they should be consent-based, minimized, and ideally content-free.

The goal would not be to create a creepy “relationship score.” The goal would be to understand the system’s regulatory structure.

---

## 13. What this literature gets right

The strongest contribution of this literature is that it replaces vague relationship language with process language.

Instead of asking only:

$$
\text{Are these people compatible?}
$$

we can ask:

$$
\text{How do their states interact over time?}
$$

Instead of asking:

$$
\text{Do they fight?}
$$

we can ask:

$$
\text{What happens after conflict begins?}
$$

Instead of asking:

$$
\text{Are they happy?}
$$

we can ask:

$$
\text{What attractor does the relationship return to after perturbation?}
$$

Instead of asking:

$$
\text{Is there love?}
$$

we can ask:

$$
\text{Is the system stable, adaptive, and capable of repair?}
$$

That shift feels genuinely useful to me.

It also resonates with neuroscience and cognitive science. Brains are dynamical systems. Emotions unfold through coupled physiological, cognitive, and social processes. Relationships are not static objects but interacting systems distributed across two bodies, two histories, and a shared environment.

---

## 14. What this literature gets wrong or cannot yet solve

The biggest weakness is measurement. Many mathematical models use variables that are easy to write but hard to measure. “Love,” “appeal,” “resentment,” and “trust” are not directly observable in the way position or velocity are.

The second weakness is oversimplification. A two-variable model may be beautiful but cannot capture culture, trauma, sexuality, family systems, mental health, social pressure, life goals, economics, or moral values.

The third weakness is identifiability. A model can fit a relationship trajectory for the wrong reasons. Without dense and valid data, mathematical elegance can become false confidence.

The fourth weakness is ethics. Relationship prediction can easily become manipulative. A model that estimates vulnerability, attachment, or breakup risk could be used to help people understand themselves, but it could also be used to control, surveil, or exploit them.

Finally, “success” itself is not simple. Does success mean staying together? Being happy? Growing? Avoiding harm? Raising children well? Maintaining autonomy? Ending respectfully when the relationship is no longer healthy? A purely predictive model can accidentally smuggle in a narrow definition of success.

---

## 15. My personal takeaway

I started with a naive but honest question: can relationships be quantified and modeled with dynamical systems?

After reading this literature, my answer is: partially, and usefully, but not completely.

Dynamical systems cannot tell us the full meaning of love. They cannot replace emotional maturity, communication, vulnerability, or ethics. They cannot make people fully predictable. They cannot turn romance into engineering.

But they can help us see patterns that ordinary language hides.

They can show that a relationship is not just about how two people feel at one moment, but how those feelings change in response to each other. They can distinguish stability from stagnation, conflict from instability, intensity from health, and love from sustainable coupling. They can formalize why repair matters. They can explain why some couples recover from shocks while others cross invisible thresholds. They can also remind us that prediction depends on measurement, and measurement depends on humility.

For someone like me, who often understands the world more naturally through systems, feedback, and logic than through emotional intuition, that is meaningful. It does not make people simple. But it makes the complexity a little more structured.

Maybe that is the best use of mathematics here: not to reduce love, but to make the dynamics of love thinkable.

---

## References and further reading

- Strogatz, S. H. (1988). “Love Affairs and Differential Equations.” *Mathematics Magazine*, 61(1), 35. [Taylor & Francis](https://www.tandfonline.com/doi/abs/10.1080/0025570X.1988.11977342)

- Sprott, J. C. (2004). “Dynamical Models of Love.” *Nonlinear Dynamics, Psychology, and Life Sciences*, 8, 303–314. [Author page](https://sprott.physics.wisc.edu/pubs/paper277.htm)

- Rinaldi, S. (1998). “Love Dynamics: The Case of Linear Couples.” *Applied Mathematics and Computation*, 95, 181–192.

- Rinaldi, S. (1998). “Laura and Petrarch: An Intriguing Case of Cyclical Love Dynamics.” *SIAM Journal on Applied Mathematics*. [SIAM](https://epubs.siam.org/doi/10.1137/S003613999630592X)

- Rinaldi, S., Della Rossa, F., Dercole, F., Gragnani, A., & Landi, P. (2010). “Love and Appeal in Standard Couples.” *International Journal of Bifurcation and Chaos*, 20(8). [ResearchGate entry](https://www.researchgate.net/publication/263878704_LOVE_AND_APPEAL_IN_STANDARD_COUPLES)

- Rinaldi, S., Della Rossa, F., Dercole, F., Gragnani, A., & Landi, P. (2015). *Modeling Love Dynamics*. World Scientific. [ResearchGate entry](https://www.researchgate.net/publication/286863179_Modeling_Love_Dynamics)

- Cook, J., Tyson, R., White, J., Rushe, R., Gottman, J., & Murray, J. D. (1995). “Mathematics of Marital Conflict: Qualitative Dynamic Mathematical Modeling of Marital Interaction.” *Journal of Family Psychology*, 9, 110–130. [University of Bath record](https://researchportal.bath.ac.uk/en/publications/mathematics-of-marital-conflict-qualitative-dynamic-mathematical-)

- Gottman, J., Swanson, C., & Murray, J. (1999). “The Mathematics of Marital Conflict: Dynamic Mathematical Nonlinear Modeling of Newlywed Marital Interaction.” *Journal of Family Psychology*. [PDF](https://www.johngottman.net/wp-content/uploads/2011/05/The-Mathematics-of-Marital-Conflict-Dynamic-Mathematical-Nonlinear-Modeling-of-Newlywed-Marital-Interaction.pdf)

- Gottman, J., Murray, J. D., Swanson, C., Tyson, R., & Swanson, K. (2002/2005). *The Mathematics of Marriage: Dynamic Nonlinear Models*. MIT Press. [MIT Press](https://mitpress.mit.edu/9780262572309/the-mathematics-of-marriage/)

- Butler, E. A. (2011). “Temporal Interpersonal Emotion Systems: The ‘TIES’ That Form Relationships.” *Personality and Social Psychology Review*, 15(4), 367–393. [SAGE](https://journals.sagepub.com/doi/10.1177/1088868311411164)

- Steele, J. S., & Ferrer, E. (2011). “Latent Differential Equation Modeling of Self-Regulatory and Coregulatory Affective Processes.” *Multivariate Behavioral Research*, 46(6), 956–984. [Taylor & Francis](https://www.tandfonline.com/doi/full/10.1080/00273171.2011.625305)

- Ferrer, E., & Helm, J. L. (2013). “Dynamical Systems Modeling of Physiological Coregulation in Dyadic Interactions.” *International Journal of Psychophysiology*, 88(3), 296–308. [ScienceDirect](https://www.sciencedirect.com/science/article/pii/S0167876012006290)

- Schoebi, D., & Randall, A. K. (2015). “Emotional Dynamics in Intimate Relationships.” *Emotion Review*, 7(4). [SAGE](https://journals.sagepub.com/doi/10.1177/1754073915590620)

- Feinberg, M. E., Xia, M., Fosco, G. M., Heyman, R. E., & Chow, S.-M. (2017). “Dynamical Systems Modeling of Couple Interaction: A New Method for Assessing Intervention Impact Across the Transition to Parenthood.” *Prevention Science*, 18(8), 887–898. [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC6402558/)

- Kuelz, A., Boyd, S., & Butler, E. (2022). “Close TIES in Relationships: A Dynamic Systems Approach for Modeling Physiological Linkage.” *Journal of Social and Personal Relationships*, 39(10), 3059–3084. [SAGE](https://journals.sagepub.com/doi/10.1177/02654075221082594)

- Iida, M., Savord, A., & Ledermann, T. (2023). “Dyadic Longitudinal Models: A Critical Review.” *Personal Relationships*, 30(2), 356–378. [Arizona Regents record](https://experts.azregents.edu/en/publications/dyadic-longitudinal-models-a-critical-review)
