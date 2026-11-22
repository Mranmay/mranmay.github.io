---
title: "Calcium Dynamics Models: From Spikes to Fluorescence"
description: "Give two models the same pair of spikes and their calcium traces can look quite different. A five-frame example shows why."
pubDate: 2026-03-23
author: Mranmay Shetty
tags: ["Calcium imaging", "Dynamical systems"]
---

During my MSc internship at the Institut de Neurosciences de la Timone and Inria, I worked with paired electrical and optical recordings from mouse visual cortex. For the same neuron I could see the spike times recorded by an electrode and the fluorescence recorded by a two-photon microscope. If two spikes arrived close together, how much of the second fluorescence peak came from calcium left over from the first?

That question also motivates my independent work on calcium dynamics. I start by running the problem forward. I take the spikes as given, choose a model for how calcium and the indicator respond, and predict the optical trace. Then I can ask which parts of the measured waveform that model could plausibly explain. The [Allen Institute calibration dataset](https://brain-map.org/our-research/circuits-behavior/ophys-ephys-calibration-data) has these paired recordings from layer 2/3 pyramidal neurons expressing GCaMP6s or GCaMP6f.

## What the decay parameter measures

A simple model adds a fixed amount of calcium for each spike. Between imaging frames, a fraction of the previous frame's calcium remains. If $s_t$ is the number of spikes in frame $t$, the update is

$$
c_t = \gamma c_{t-1} + A s_t.
$$

Here $A$ is the calcium increment per spike and $\gamma$ is the fraction remaining one frame later. For an exponential decay with time constant $\tau_d$ and an imaging interval $\Delta t$, the fraction remaining is $\gamma=\exp(-\Delta t/\tau_d)$. The same cell and indicator will therefore have a different per-frame decay factor if I resample the trace.

Calcium is a hidden quantity in this calculation. A linear observation model predicts the measured fluorescence as $F_t=F_0+\alpha c_t+\epsilon_t$. Here $F_0$ is the baseline, $\alpha$ converts a calcium increment into fluorescence units, and $\epsilon_t$ accounts for measurement noise. Subtracting the baseline and dividing by it gives the familiar $\Delta F/F_0$ trace.

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

The update above jumps as soon as a spike arrives. A finite-rise response builds up before it decays. One way to represent that is to add a copy of this response after each spike, once $u$ time units have elapsed.

$$
h(u)=K\left(e^{-u/\tau_d}-e^{-u/\tau_r}\right),\qquad 0<\tau_r<\tau_d.
$$

At the spike itself, $h(0)=0$. The fast term then falls away more quickly, and the response reaches its peak some time after the spike. $K$ sets its amplitude. An algorithm that treats the observed peak time as the spike time would place the spike late in this example.

A saturating indicator introduces a different ambiguity. A Hill response scales fluorescence with $c^n/(K_d^n+c^n)$, where $K_d$ is the calcium level giving half of the maximum signal. Two identical calcium increments can then produce different fluorescence increments depending on how much calcium was already present. Near saturation, even a substantial increase in calcium can yield little extra fluorescence. Published forward models such as MLspike combine calcium decay with indicator response, baseline and noise. [Example using MLspike on Allen recordings](https://pmc.ncbi.nlm.nih.gov/articles/PMC8285106/)

## What I look for in paired recordings

I would first compare an isolated electrical spike with its optical transient. The delay to peak probes the rise term, while the falling portion constrains the decay. Closely spaced spikes ask a different question. Once I know the isolated response, does adding two copies predict the burst's peak and tail? A consistent error in burst height would be a reason to examine the observation model. I would also check baseline drift and noise before attributing that error to saturation.

This distinction matters when going backwards to estimate spikes. In the noiseless linear model, subtracting $\gamma c_{t-1}$ from $c_t$ recovers the new input. With the wrong decay, some signal from an earlier spike survives that subtraction. With finite rise, a spike contributes to the rise over several frames. A plausible-looking reconstructed fluorescence trace can therefore coexist with a poorly timed spike estimate. Paired recordings let me check both.

[Read the Allen calibration study](https://pubmed.ncbi.nlm.nih.gov/33683198/) · [Read about exponential decay and finite rise times](https://pmc.ncbi.nlm.nih.gov/articles/PMC4881387/)
