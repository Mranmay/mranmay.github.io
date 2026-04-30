---
title: "Modeling Romantic Relationships With Dynamical Systems"
description: "A personal, skeptical literature review of whether romantic relationships can be modeled as dynamical systems, from Strogatz and Rinaldi to Gottman, physiological coregulation, state-space models, and modern latent continuous-time methods."
pubDate: "2025-05-21"
author: "Mranmay Shetty"
tags:
  - relationships
  - dynamical-systems
  - mathematics
  - psychology
  - complex-systems
  - literature-review
---

## Executive summary

I went into this literature hoping for something like a clean “physics of relationships,” and I did not find that. What I found instead is more interesting and more limited: there is a real research tradition that treats romantic and dyadic interaction as a dynamical system, but it works best when the target is not “love” in the abstract so much as a measurable process unfolding through time — affect, positivity versus negativity, physiological linkage, repair attempts, or daily fluctuations in closeness and stress. The strongest parts of the literature are not the famous Romeo-and-Juliet toy models, but the empirical traditions that connect repeated observations to interpretable parameters such as inertia, set points, damping, partner influence, and basins of attraction.

The literature splits pretty naturally into three layers. First there are the conceptual ODE models, from Strogatz through Sprott and Rinaldi, which ask what kinds of long-run behavior are even possible if feelings obey deterministic equations. Second there are empirical couple-interaction models, especially Gottman-style difference equations and later latent differential equation work, where the goal is to estimate interpretable parameters from observed interaction or diary data and relate them to satisfaction, divorce risk, or intervention effects. Third there is the broader modern toolbox — state-space models, DSEM, latent ODEs, regime-switching models, physiological coregulation frameworks — which is less “romantic-love theory” and more a serious methodology for intensive dyadic data.

My bottom line is this: yes, people have absolutely tried to quantify romantic dynamics with dynamical-systems methods, and some parts of that effort are mathematically rigorous and empirically useful. But no, there is no accepted model that can take “all the variables in a relationship” and predict success or failure in any universal sense. Relationship dynamics appear partially predictable at the level of short-run regulation and interaction structure, but they are noisy, context-dependent, and under-measured. If I wanted to do personal research on this seriously, I would start with one narrow layer — daily affect plus satisfaction, or conflict behavior plus physiology — rather than trying to build a single giant theory of human attachment.

## Why I wanted to know this

I thought of looking into this for a very personal reason: I often find people hard to understand in general and mostly have a logical perspective to things rather than an emotional one, I was curious to see if anyone has developed or researched on ways to quantify all the variables in a relationship especially romantic ones and model them in a dynamical systems methods ...

That curiosity turns out not to be naive at all. A surprising amount of serious work has asked whether relationships can be treated as evolving systems with state variables, feedback loops, thresholds, lags, attractors, and sometimes bifurcations. But the literature also makes something painfully clear: the minute I ask for “all the variables,” the project becomes impossible. The models that actually work do so by aggressively narrowing the target — for example, to turn-by-turn positivity and negativity in a conflict discussion, or to daily positive and negative affect, or to coupled heart rate and respiration.

So this post is really about a more disciplined question: **what can be modeled well enough to be useful, and what remains too high-dimensional, ambiguous, or ethically intrusive to formalize?** I came away more sympathetic to the project than I expected, but also more skeptical of grand claims. The models are best when they help us think clearly about local mechanisms — self-regulation, partner influence, stability versus fragility, repair versus escalation — and worst when they pretend to have captured the whole relationship in a couple of symbols.

## Where the dynamical-systems idea came from

The canonical starting point is the famous linear Romeo-and-Juliet setup associated with Strogatz. In Sprott’s summary, the simplest form is

$$
\dot R = aR + bJ,\qquad \dot J = cR + dJ,
$$

where \(R(t)\) and \(J(t)\) are Romeo’s and Juliet’s feelings, \(a,d\) capture how each person’s own current feelings feed back on themselves, and \(b,c\) capture response to the partner’s feelings. This is intentionally minimal, but it already gives nodes, saddles, stable or unstable foci, and in special cases endless cycling when eigenvalues are purely imaginary. In other words: even the toy model is enough to separate mutually amplifying love, mutual collapse to apathy, unstable escalation, and oscillation.

The linear algebra matters because it tells me what the model can and cannot do. For the matrix
\[
A=\begin{pmatrix} a & b \\ c & d \end{pmatrix},
\]
the eigenvalues are
\[
\lambda_{\pm}=\frac{(a+d)\pm\sqrt{(a-d)^2+4bc}}{2}.
\]
If \(\operatorname{tr}(A)=a+d<0\), trajectories can decay toward an equilibrium; if \(a+d>0\), they can blow up; if the discriminant is negative, I get oscillatory behavior around the equilibrium. What I like about this is not that it is realistic, but that it forces a clean question: **is a relationship stabilizing, amplifying, or cycling given small perturbations?** That question survives even when the model becomes much more complicated.

Sergio Rinaldi’s work made the toy models more psychologically flavored by adding mechanisms such as oblivion, reaction to appeal, and reaction to being loved. The abstract description of linear couples is already richer: forgetting pushes feelings back down, appeal pulls them up, and reciprocal response links the partners. A representative linear-couple form is
\[
\dot x_1=-\alpha_1 x_1+\beta_1 x_2+\rho_1A_2,\qquad
\dot x_2=-\alpha_2 x_2+\beta_2 x_1+\rho_2A_1,
\]
where \(\alpha_i>0\) is forgetting, \(\beta_i\) is responsiveness to the partner’s current state, and \(A_i\) is perceived appeal. This is still analytically tractable, but it already moves beyond pure mutual reactivity and lets feelings grow from indifference because appeal enters as an external drive.

Rinaldi’s later “standard couples” model is the point where the literature becomes unmistakably nonlinear. There the state variables are each partner’s current feelings \(x_1,x_2\), and the equations take the form
\[
\dot x_1=-\alpha_1 x_1+R_1(x_2)+S_1(A_2),\qquad
\dot x_2=-\alpha_2 x_2+R_2(x_1)+S_2(A_1).
\]
Here \(R_i(\cdot)\) is a nonlinear reaction to the partner’s love and \(S_i(\cdot)\) captures perceived appeal. This framework gives the famous distinction between **robust couples** and **fragile couples**: outside a cusp-bounded region in appeal-space there is one stable equilibrium, but inside that region there can be two stable equilibria separated by a saddle, so long-run outcome depends on initial conditions and basin geometry.

This is where bifurcation language stops being a metaphor and becomes useful. In the standard-couple model, the equilibria are generically one or three, and fold bifurcation curves organize the parameter region; cusp points mark codimension-two collisions of equilibria. Rinaldi and coauthors interpret these geometrically as fragile versus robust relationship regimes, and as favorable versus unfavorable evolution from the state of indifference. The key intuition is that some relationships are locally stable in more than one qualitatively different way, and tiny changes in appeal or responsiveness can move the couple across a boundary where the positive state disappears.

One thing I found especially clarifying is that not every romantic model can cycle. In the standard-couple setup, the divergence is constant and negative:
\[
\nabla\cdot f=-(\alpha_1+\alpha_2),
\]
so by Bendixson’s theorem limit cycles are excluded and the attractors can only be equilibria. That is an extremely useful correction to the vague way people sometimes talk about “relationship cycles.” A model can be nonlinear, bistable, unstable, and bifurcating without allowing closed oscillations. If I want true cyclicity, I need either a different structure, a higher-dimensional system, a delay, or some explicit oscillatory mechanism.

That brings me to the beautiful weirdness of the Laura-and-Petrarch model. Rinaldi introduces three ODEs, not two, because the poet’s love is mediated by a slowly varying internal variable — inspiration. In effect, Petrarch’s love, Laura’s warmth or coldness, and poetic inspiration coevolve on different timescales. The paper shows conditions for a **globally stable slow-fast limit cycle**, interprets the cyclic motion as oscillation between ecstasy and despair, and notes that the cycle can disappear through a supercritical Hopf bifurcation as parameters change. This is a much more ambitious claim than the standard-couple model: not just multiple equilibria, but an analytically characterized oscillatory attractor in a three-dimensional sentimental system.

Sprott pushes further toward chaos. He starts from the Strogatz-style two-person linear model, adds love triangles, and then inserts nonlinear saturation terms such as \(bJ(1-J^2)\) so that excess love can become smothering and extreme hostility can trigger repair-like reversal. In two dimensions these nonlinear variants still do not produce chaos, but in nonlinear love triangles they can. Sprott explicitly reports a strange attractor, a positive largest Lyapunov exponent, and a Kaplan–Yorke dimension just above 2 in one example. The lesson is simple: the moment the system becomes nonlinear and high-dimensional enough, “romance” can become formally chaotic, at least inside the toy-world assumptions of the model.

If I step back, the historical lineage looks like this. Strogatz gave the memorable pedagogical seed. Sprott explored how nonlinearities and third parties can create complicated qualitative behavior, including chaos. Rinaldi and collaborators turned this into a sustained research program about appeal, oblivion, return, bistability, cusp bifurcations, fragile versus robust couples, and story-specific case studies such as Francesco Petrarch and the Canzoniere. The mathematics got sharper at each step, but so did the underlying warning: every variable I add makes the model richer **and** less identifiable from ordinary relationship data.

Conceptually, the modeling lineage runs from minimal love ODEs to linear stability analysis, then to appeal, forgetting, and response terms, nonlinear reaction functions, bifurcations and multiple equilibria, slow-fast cycles, and high-dimensional nonlinear systems. A parallel empirical branch moves toward diary data, video-coded interaction, physiology, EMA, and other time-series measurements.

## What the empirical couple models actually do

The most influential empirical strand is the Gottman program, and it is importantly different from the love-ODE tradition. The core object is not “love level” but observed interaction, often coded as positive minus negative behavior at each turn of speech during conflict. In one of the central formulations, if \(W_t\) and \(H_t\) are wife and husband scores at turn \(t\), the dynamics are written as
\[
W_{t+1}=a+r_1W_t+I_{HW}(H_t),\qquad
H_{t+1}=b+r_2H_t+I_{WH}(W_t).
\]
Here \(a\) and \(b\) are uninfluenced baselines or set points, \(r_1,r_2\) are emotional inertia terms, and \(I_{HW}, I_{WH}\) are nonlinear influence functions mapping one partner’s current state into the other’s next response.

This is conceptually elegant because each parameter means something I can almost explain in plain English. **Set point** is where someone tends to drift absent partner influence. **Emotional inertia** is how sticky their state is from one moment to the next. **Influence function** asks how one partner’s current positivity or negativity moves the next turn of the other partner, often with thresholds and asymmetric slopes. Gottman’s earlier theoretical paper explicitly emphasizes nonlinear influence functions with thresholds, and the later work discusses stable and unstable steady states, basins of attraction, and the idea that opening conditions can strongly shape where a conversation ends up.

What I find compelling here is that the model is psychologically interpretable without pretending to be a theory of everything. It is a model of **interaction regulation**. The broader Gottman program reported that longitudinal studies could predict whether couples would divorce or stay married, and how satisfied they would be if they stayed married, with over 90% accuracy using behavior, perceptions, and physiology collected during interactions. The mathematical modeling papers were meant to build theory beneath those predictions, not replace them with a single magic equation.

The 1999 marital-conflict paper is especially important because it links estimated dynamic parameters to later outcomes. The paper reports that couples who eventually divorced began with more negative uninfluenced steady states, more negative influenced husband steady states, and lower negative thresholds in the influence function. Related analyses in the 1995 paper also concluded that husband and wife set points were significantly predictive of divorce. So the result is not just “negative couples do worse”; it is more specific: **the geometry of interaction matters**, especially how negative the system’s resting points are and how easily negativity starts to dominate partner influence.

The 2002 general-systems paper makes another point that still feels modern to me: there may be multiple steady states for a couple, and starting conditions can push the same couple toward different conversational futures. With bilinear or sigmoidal influence functions, a pair can have two stable steady states and one unstable one; initial scores determine the basin they start in. The authors even discuss a catastrophe scenario in which slow parameter drift removes the positive steady state altogether, leaving only a negative attractor. That is an unusually precise way to formalize the intuition that some relationships feel fine until, all at once, they no longer have a “good mode” available.

Gottman and colleagues also confront one of the model’s shortcomings directly: repair. They note that a pure attractor model can be “grim” because it offers no mechanism by which a conversation that starts badly can recover. Their empirical observation was that only about 4% of couples who began negatively managed to turn the interaction significantly around, but that rarity was still enough, in their view, to motivate adding switch-like repair terms. I like this philosophically because it shows the right modeling instinct: when the data reveal a qualitatively important pattern the equation cannot express, the answer is not blind loyalty to the old equation. It is to change the model.

A second empirical stream comes from latent differential equation and idiographic dyad modeling. Steele and Ferrer used daily self-reports of positive and negative affect from romantic couples and fit a damped linear oscillator in a latent differential equation framework. In broad terms, the state equation is something like
\[
\ddot x_i(t)=\eta_i x_i(t)+\zeta_i \dot x_i(t)+\gamma_{ij}x_j(t)+\kappa_{ij}\dot x_j(t)+\varepsilon_i(t),
\]
where the first two terms capture a person’s own restoring or amplifying tendency and the latter terms capture partner influence through displacement and rate-of-change. Their results suggested an absence of damping in relationship-specific affect, stronger positive than negative affect influence at the individual level, and differentiated cross-partner coupling patterns for positive versus negative affect.

That same research line is careful about heterogeneity. In a later idiographic paper, Steele, Ferrer, and Nesselroade fit several differential-equation models to each couple’s daily affect data and used AICc to classify the most likely interaction pattern for each dyad. Strikingly, within that sample the most likely style was often **independence**, meaning that many couples’ daily affect traces did not show strong evidence of emotional interrelation at the timescale observed. I think this is one of the healthiest findings in the literature because it cuts against the romantic temptation to assume every close relationship must show strong continuous coupling if only we model it cleverly enough. Sometimes the right answer is simply: not much coupling at this timescale.

A third empirical branch sits closer to developmental and intervention science. Feinberg and colleagues used micro-coded positivity and negativity from videotaped couple tasks around the transition to parenthood, modeling these with coupled-oscillator ideas to study self- and co-regulation before and after birth and under intervention versus control conditions. Their sample was only 34 heterosexual couples, which is not large, but it is methodologically valuable because it showed how dynamic parameters can serve as intervention-sensitive mechanisms rather than just descriptive features. One reported finding was that men’s positive behaviors shifted from damping to amplifying women’s negative behaviors in the control group after the transition to parenthood, whereas in the intervention group those same positive behaviors exerted a stronger damping effect on women’s negativity. That is exactly the kind of result I want from a dynamical model: not a vague statistical association, but a mechanistic statement about how the local flow changed.

If I had to summarize the empirical lesson in one sentence, it would be this: the most useful dynamical models of relationships are not trying to solve romance in general; they are estimating a couple’s **local rules of regulation**. They ask whether negativity is sticky, whether partner positivity dampens or amplifies the other person’s bad state, whether there are multiple attractors, whether repair exists, and whether those quantities differ across couples or interventions. That is a much humbler goal than predicting love itself, and because it is humbler, it is often more informative.

## What newer latent-state models add

The moment data become noisy, irregular, multivariate, and only partially observed, the natural language shifts from hand-derived ODEs to latent-state models. A very general linear state-space setup writes
\[
\eta_{it}=\nu+B\eta_{i,t-1}+\zeta_{it},\qquad
y_{it}=\tau+\Lambda \eta_{it}+\epsilon_{it},
\]
where \(\eta_{it}\) are latent states, \(y_{it}\) are observed indicators, \(B\) governs state evolution, and \(\Lambda\) links latent states to measurements. Chow’s overview emphasizes that state-space methods are especially useful for intensive longitudinal data and notes a typical setting with many repeated measures — often \(T>50\) — where conventional SEM becomes cumbersome.

For relationship research, that matters because I rarely observe the psychologically meaningful state directly. What I see might be self-reports, facial expressions, heart rate, speech features, or app-based ratings, each of which is noisy and partial. State-space thinking lets me separate the **measurement model** from the **dynamic model**. That is not just a statistical technicality; it is a conceptual improvement. It lets me say, for example, that “momentary security” is latent, but can be imperfectly indicated by warmth ratings, touch, and reduced physiological arousal, while the latent state itself follows autoregressive or continuous-time dynamics.

Dynamic Structural Equation Modeling (DSEM) is the clearest modern generalization for this literature. Asparouhov, Hamaker, and Muthén describe DSEM as a framework for intensive longitudinal data that combines multilevel modeling, time-series modeling, SEM, and time-varying effects modeling. It is estimated with Bayesian MCMC, supports observed and latent lagged dependencies, can handle long studies, and is explicitly motivated by data from smartphones and other ambulatory devices — daily diary, EMA, and ESM included. They also discuss DIC as one model-comparison tool inside the framework.

For dyads, DSEM is attractive because it gives me a middle ground between oversimplified hand-built ODEs and purely black-box forecasting. I can write actor and partner lags, allow random effects so couples differ in inertia and cross-lagged influence, include latent constructs instead of raw scores, and keep the observation schedule irregular if needed. If I wanted to study whether one partner’s stress today predicts the other partner’s irritability tomorrow while controlling for each person’s own carryover, DSEM is almost tailor-made for that.

There is also a continuous-time latent-ODE direction. Steele and Ferrer’s latent differential equation work already sits in this space conceptually, but modern machine-learning formulations make it more flexible. The Latent ODE paper frames irregularly sampled trajectories as deterministic evolution of an initial latent state under a learned ODE, often trained variationally; ODE-RNNs combine ODE dynamics between observations with discrete updates at observation times. The point is not that these models are romance-specific — they are not — but that they solve a problem that relationship data very often have: irregular timing, missingness, uneven spacing, and latent trajectories that should evolve smoothly between observed moments.

I still think the purely neural versions should be treated cautiously here. Their advantage is expressive power; their disadvantage is interpretability. In affective computing, constrained neural ODEs have been used to model smoothly evolving emotion distributions with temporal dependence and explicit smoothness/range constraints. That is methodologically promising for dyadic affect, especially if I am trying to infer latent valence/arousal trajectories from speech, video, or multimodal signals. But if my actual question is “why do some couples spiral and others stabilize?”, I would usually prefer a model whose parameters I can name — damping, threshold, self-regulation, partner gain — over a highly flexible neural flow that forecasts well but explains little.

The bridge between old and new, to me, is physiological coregulation. Ferrer and Helm explicitly model heart rate and respiration in couples with a differential-equation framework that separates self-regulation and coregulation. Their general first-order form can be read as movement toward one’s own equilibrium plus coupling to the discrepancy from the partner:
\[
\dot x = a_1(x^\ast-x)+a_2(y-x),\qquad
\dot y = b_1(y^\ast-y)+b_2(x-y).
\]
In their study of 32 couples, the model was applied directly to each dyad’s physiological time series across multiple tasks, and respiration during imitation showed coordination between partners; estimated physiological parameters were also related to parameters from daily affect models.

That work connects nicely to Butler and Randall’s conceptual definition of coregulation as a bidirectional linkage of oscillating emotional channels contributing to emotional stability for both partners. What I like here is that “coregulation” becomes something I can operationalize rather than just admire. It is no longer only a poetic description of emotional attunement; it becomes a question about coupled trajectories, feedback structure, and recovery toward baseline.

## What I would measure and how I would model it

The single biggest practical insight from this literature is that model choice should follow data density and question type. If I have turn-by-turn or second-by-second observations in a lab conflict task, then difference equations, state-space models, or coupled ODEs make sense. If I have 14 to 30 days of diary or EMA data, then VAR, DSEM, or simpler continuous-time latent models are usually more realistic. If I only have one pre/post satisfaction score per person, then talking about dynamical systems is usually just cosplay.

The measurement modalities that appear most useful fall into four buckets. **Daily or momentary self-report** is the easiest and often enough for affect or satisfaction dynamics; Steele and Ferrer’s work is the clearest example. **Coded behavior** from video is more labor-intensive but closer to Gottman’s interaction-regulation tradition. **Physiology** — heart rate, respiration, RSA, skin conductance — adds a lower-level channel for co-regulation and can reveal linkage even when self-report is flat. **Smartphone or digital traces** are best treated as contextual or proxy measurements rather than direct windows into relationship quality; they are promising, but more ethically delicate and conceptually noisier.

If I wanted to formalize the choice set, I would think of it like this.

| Model family | Typical data requirements | What the parameters mean | Predictive power | Empirical support in romantic/dyadic work |
|---|---|---|---|---|
| Linear ODE love models | Low-to-moderate; mainly conceptual unless heavily simplified | High interpretability | Low-to-moderate | Strong historical/theoretical, weak direct validation |
| Nonlinear ODE / bifurcation models | Moderate-to-high, especially if estimated from data | High if low-dimensional | Moderate in simulation, limited real-world estimation | Strong mathematical lineage, sparse empirical fitting |
| Difference-equation couple models | Turn-level interaction sequences | High interpretability: set points, inertia, thresholds, partner influence | Moderate-to-high for interaction outcomes, especially as theory-building tools | Strong in Gottman tradition |
| Latent differential equations / coupled oscillators | Repeated diary or dense time-series data | Moderate-to-high interpretability | Moderate | Good empirical support in affect and coregulation studies |
| State-space / DSEM | Intensive longitudinal data, often irregular and noisy | Moderate interpretability, high flexibility | Moderate-to-high | Strong methodological support; growing applied use |
| Neural / latent ODE variants | Larger irregular time series, often multimodal | Lower interpretability | Potentially high forecasting | Methodologically promising; not yet a settled romance-specific literature |

The ratings in this table are my synthesis of the sources reviewed here, not a benchmark table from any one paper. The general pattern is that interpretability drops as flexibility rises, and that the most empirically anchored relationship models still live in the middle of that tradeoff rather than at either extreme.

For validation, I would keep the metrics honest and boring. For continuous outcomes: one-step-ahead RMSE/MAE, held-out log likelihood if the model is probabilistic, and recovery of known qualitative features such as damping sign, threshold location, or attractor count. For couple outcome prediction: AUC or balanced accuracy if the target is dissolution versus stability, but only if the target window and class balance are specified. For mechanism claims, I would care as much about identifiability and parameter uncertainty as about predictive accuracy. An uninterpretable parameter with a dramatic estimate is not an insight; it is just a nicely formatted hallucination.

That last point matters because ODE estimation can fail in subtle ways. Miao and colleagues call identifiability analysis the first step in determining unknown parameters in nonlinear ODE models. Wieland and colleagues distinguish structural from practical identifiability and argue that practical identifiability is often the harder real-world problem, especially under partial observation. Simpson and Maclaren then push profile-likelihood workflows as a way to tie together identifiability analysis, estimation, and prediction uncertainty. For relationship models, this is not optional sophistication; it is survival. The parameter most likely to sound psychologically profound may also be the one the data barely identify.

On the estimation side, the toolchain depends on model class. Ferrer and Helm fit their differential equations using SAS’s `MODEL` procedure. Steele and colleagues used model comparison with AICc across idiographic differential-equation candidates. DSEM is Bayesian and MCMC-based in Mplus. Chow and colleagues show that SAEM is useful for nonlinear ODE models with random effects and irregularly spaced observations, which is directly relevant if I am trying to fit heterogeneous dyads without assuming equal observation intervals. In practice, that means my estimation strategy is part of the research design, not something I get to postpone until after measurement.

## What is feasible, ethical, and worth doing personally

If I were actually going to do this on myself or on volunteer couples, I would avoid the fantasy of total quantification. The practical research question has to be narrow enough that both the data and the ethics stay manageable. “Can I model whether this couple can recover from negativity once a conflict begins?” is plausible. “Can I infer the true state of the relationship from all available digital traces?” is not just overconfident; it is morally suspect.

The privacy issue is not secondary here. Relationship data are almost definitionally co-owned: my feelings about you are partly also data about you. If I collect diaries from both partners, record conflict, or use phone-based traces, I am no longer just doing self-quantification. I am building a two-person surveillance system. That means consent has to be explicit, revocable, symmetric, and specific about what is collected, how it is stored, and whether one partner gets to see the other’s raw data. Even a technically elegant model is a bad idea if the data-collection process itself degrades trust.

There is also a subtler ethical problem: reification. Once a model spits out a “negative attractor” or “weak repair parameter,” it becomes tempting to treat that as the relationship’s hidden truth. But the literature itself does not justify that level of ontological confidence. Most models are local, task-specific, and timescale-specific. A couple can have a nasty conflict dynamic and still be stable in everyday companionship; they can have physiological linkage without emotional security; they can look independent in daily-affect data and still matter enormously to each other. The model is a lens, not a verdict.

With that said, I do think there are three realistically good research designs here.

### A minimal personal project

If I wanted the lightest-weight serious design, I would run a **14-day dyadic diary/EMA study** with 4 to 5 prompts per day. At each prompt I would measure positive affect, negative affect, felt closeness, perceived responsiveness, conflict since last prompt, and perhaps whether we were physically together. That yields roughly 56 to 70 observations per person, which is not luxurious but is already in the zone where intensive longitudinal methods become meaningful. I would analyze it with a simple dyadic VAR or DSEM first, and only move to continuous-time latent models if the temporal spacing were irregular enough to justify it.

### A behavior-focused lab project

If my real interest were repair versus escalation, I would do **video-coded conflict tasks**. One or two 10- to 15-minute discussions, micro-coded at the turn level or in short bins, is enough to estimate difference-equation or state-space models of positivity and negativity. This is the most direct descendant of the Gottman tradition, and it is where parameters like set point, inertia, threshold, and repair mean something concrete. The downside is that coding is laborious and the ecological validity is narrower than diaries.

### A multimodal coregulation project

If I wanted the most scientifically interesting version, I would collect **EMA plus physiology**. The design could pair daily or momentary self-report with one structured interaction in the lab during which heart rate and respiration are recorded continuously. The self-report side gives subjective state and outcome variables; the physiology gives me a second channel for coupling that is less filtered by self-presentation. This is the design I would trust most if my actual question were whether co-regulation exists, not just whether partners report feeling connected.

As a rough rule of thumb, my sample-size guidance would be: **one dyad is enough for an idiographic pilot, but not for generalization**; **50+ repeated observations per person** is where state-space and continuous-time thinking start to feel justified; **30+ observations** is about the lower end where DSEM-style longitudinal structure becomes more plausible than static models; and if I want multilevel inference about between-couple heterogeneity, I would aim for **at least dozens of couples, ideally 50 to 100 or more**, depending on model complexity. That is not a substitute for power analysis or simulation, just a realistic design heuristic extracted from how these methods are typically framed and applied.

For preprocessing, I would keep the pipeline boring and reproducible: synchronize timestamps, resample onto an explicit grid only if necessary, center variables thoughtfully, inspect missingness before imputing anything, smooth physiological traces only as much as justified by noise characteristics, and pre-register what counts as self-regulation versus partner influence before fitting. For nonlinear ODEs I would test identifiability before writing any grand interpretations. For comparison, I would fit a simpler model first — often a dyadic AR or VAR — and ask whether the fancier mechanism actually buys interpretability or predictive gain.

### Open questions and limitations

The biggest unresolved issue in this whole literature is still **timescale**. A couple can be stable at the level of years, oscillatory at the level of weeks, and chaotic-looking at the level of seconds. Different models are answering different questions. Another open issue is **construct validity**: is “positive minus negative behavior” really the right state variable, or just the one that is easiest to code? And finally there is **external validity**: many classic studies use small or specialized samples, heterosexual couples, lab conflict tasks, or historically narrow populations. That does not make the findings worthless; it just means I should treat them as structured clues rather than universal laws.

## Recommended reading

If I were handing myself a compact reading list after this, I would start with: Strogatz’s pedagogical Romeo-and-Juliet model as summarized and extended by Sprott; Rinaldi’s linear couples paper; Rinaldi’s standard-couple and Petrarch papers for bifurcations and cycles; Gottman’s difference-equation papers and the book The Mathematics of Marriage for empirical interaction modeling; Ferrer and Helm for physiological coregulation; Steele and Ferrer for latent differential equations on daily affect; and Asparouhov, Hamaker, and Muthén for DSEM as the most practical general framework for intensive longitudinal relationship data.

What I take from all of this is not that romance has finally been mathematized, but that there are parts of intimacy — especially regulation, coupling, and stability — that become sharper when I let myself think in trajectories instead of traits. That feels useful to me. It does not make people easy to understand. But it does make some forms of confusion legible. And honestly, that is already a lot.
