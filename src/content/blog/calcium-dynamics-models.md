---
title: "Calcium Dynamics Models: From Spikes to Fluorescence"
description: "Give two models the same pair of spikes and their calcium traces can look quite different. A five-frame example shows why."
pubDate: 2026-11-23
author: Mranmay Shetty
tags: ["Calcium imaging", "Dynamical systems"]
---

When working with two-photon recordings, I like to start with the forward question. If I know when a neuron spiked, what signal should its calcium indicator produce?

A simple model adds a fixed amount of calcium for each spike. Between imaging frames, a fraction of the previous frame's calcium remains. If $s_t$ is the number of spikes in frame $t$, the update is

$$
c_t = \gamma c_{t-1} + A s_t.
$$

Here $A$ is the calcium increment per spike and $\gamma$ is the fraction remaining one frame later. To predict fluorescence in a linear observation model, I multiply the calcium signal by a gain and add baseline fluorescence.

## Two spikes, two decay rates

Start with zero calcium. Give the model one spike in frame 1 and another in frame 3, both with $A=1$. These are simulated values in arbitrary units. The only thing I change is the fraction of calcium retained between frames.

| Frame | Spike count | Calcium with 50% retained | Calcium with 80% retained |
| --- | ---: | ---: | ---: |
| 1 | 1 | 1.00 | 1.00 |
| 2 | 0 | 0.50 | 0.80 |
| 3 | 1 | 1.25 | 1.64 |
| 4 | 0 | 0.63 | 1.31 |
| 5 | 0 | 0.31 | 1.05 |

Look at frame 5. The slower-decaying signal still exceeds the size of the first peak, two frames after the last spike. With the faster decay, it has already fallen to about a third of that peak. The difference comes entirely from how the model carries past activity into the present.

## What changes when the indicator takes time to respond?

The update above jumps immediately when a spike arrives. A model with a finite rise time lets the fluorescence peak arrive later. A saturating observation model changes something else again. As the indicator approaches its ceiling, the next spike can produce a smaller change in fluorescence than the first. Keeping the spike times fixed makes it easier to see which assumptions change the timing of a peak and which change its height.

[Read about exponential decay and finite rise times](https://pmc.ncbi.nlm.nih.gov/articles/PMC4881387/) · [See a spike-to-fluorescence model with indicator saturation](https://pmc.ncbi.nlm.nih.gov/articles/PMC8285106/)
