---
title: "A new method of spike deconvolution from calcium imaging?"
description: "While comparing spike-inference methods during my MSc, I wondered what would happen if a model could give several plausible answers for the same fluorescence trace. I’ve been building one called XYBER."
pubDate: 2026-03-23
updatedDate: 2026-11-23
author: Mranmay Shetty
tags: ["Calcium imaging", "Spike inference"]
---

Last semester I worked with Laurent Perrinet at the Institut de Neurosciences de la Timone and Bruno Cessac at Inria on spike inference and motif discovery. In one part of the project, I had two recordings of the same mouse visual cortex neuron. An electrode told me when it fired. The microscope showed a fluorescent trace that rose and gradually fell. Cover up the electrode trace and a surprisingly hard question remains. How many spikes made that bump? [Allen Institute paired recordings](https://brain-map.org/our-research/circuits-behavior/ophys-ephys-calibration-data)

## Why I wanted to try combining two approaches

One of the methods I tried was OASIS. It starts with a little bit of biophysics. A spike raises the calcium signal, and some of that signal is still there in the next frame. In the simplest version, if a spike adds one unit and 80% remains at each frame, a second spike two frames later brings the signal to 1.64. OASIS works backwards from the measured trace, looking for a sparse set of positive inputs that, given the assumed decay, could account for it. I like that I can point to the falling side of a bump and say what the model thinks is happening there. [OASIS paper](https://doi.org/10.1371/journal.pcbi.1005423)

CASCADE takes a different route. It sees windows of fluorescence paired with firing rates derived from electrical recordings. Its five trainable layers comprise three temporal convolutions, a dense layer and an output layer. The network gets to learn which shapes tend to accompany firing without anyone specifying a calcium-decay equation. The physics still shapes every training example. It just doesn’t have to be written into the network. [CASCADE paper](https://doi.org/10.1038/s41593-021-00895-5)

While I was doing that comparison, I kept coming back to a question. Why not let a network suggest a few plausible spike trains, run each one through a model of how spikes produce fluorescence, and see which ones could have made the trace I actually recorded? That was the idea I later described in my UCL research statement. It also mattered for the motif part of my MSc. If several spike timings fit the recording equally well, I’d want to know that before calling a sequence of cells a repeating pattern.

## From a fluorescence trace back to spike times

I started working on that idea independently. My model is called **XYBER**, short for **eXtracting spike times bY Bayes-risk Event Reconstruction**. The part I’ve built so far tackles a decision that comes before the fluorescence check. Once I have several plausible trains, which spike times should I actually report?

Say the evidence supports one spike somewhere in three adjacent frames. Each frame on its own might look too uncertain to call. Threshold them separately and I could report zero spikes, even though almost every plausible explanation contains one. That’s the sort of mistake I wanted XYBER to handle.

XYBER takes eight seconds of fluorescence at a time and estimates a distribution over spike counts in each frame, taking into account whether the preceding two frames contained a spike. It draws 256 possible trains and keeps the middle four seconds of each window. To report events, it looks for a train that incurs a small average penalty across those draws. A missed spike costs something, an extra spike costs something, and a small timing error costs less. That decision is what “Bayes-risk” means in the name. Checking the candidate trains against a forward model of fluorescence is still an open part of my original idea.

<figure>
  <a href="/images/posts/calcium-dynamics-models/xyber-architecture.webp"><img src="/images/posts/calcium-dynamics-models/xyber-architecture.webp" width="1440" height="484" loading="lazy" decoding="async" alt="XYBER uses an eight-second fluorescence window to estimate framewise spike counts, sample possible trains and choose event times." /></a>
  <figcaption>The same count estimates give me a firing rate and a set of individual spike times. I can check each against the electrode.</figcaption>
</figure>

## Where it works, and where I still get it wrong

I’ve tested XYBER retrospectively on paired optical and electrical recordings from four indicator profiles. The clearest result so far is on GCaMP8m. Counting a prediction as a match if it falls within 50 milliseconds of a recorded spike, XYBER reached an event F1 of **0.912**, compared with **0.888** for my local ENS² baseline. F1 takes both missed spikes and extra detections into account. These are results for the implementations and recordings I tested.

GCaMP8s is the example I keep coming back to. In the lower panel below, the electrode recorded **15 spikes**. Two separately trained runs of XYBER reported **22 and 49** from the very same fluorescence. Changing how I normalized unusually large optical signals helped with overcounting, but that gap between runs is still there. Across the GCaMP8s groups, XYBER’s 50-ms F1 was 0.852 and ENS² reached 0.869.

<figure>
  <a href="/images/posts/calcium-dynamics-models/xyber-examples.webp"><img src="/images/posts/calcium-dynamics-models/xyber-examples.webp" width="1440" height="947" loading="lazy" decoding="async" alt="Two paired recordings. In the lower panel the electrode records 15 spikes and two XYBER runs report 22 and 49." /></a>
  <figcaption>Start with the electrical spike times beneath each fluorescence trace, then look down the rows at the model outputs. The extra events in the lower panel are easier to see here than in an average score.</figcaption>
</figure>

What I’d like to know next is whether a fluorescence check would actually catch a case like those 49 spikes. I can feed those event times into a forward model and ask what trace they imply. If that trace looks much like the one predicted by 15 spikes, I’ve learned something about what the recording can resolve. If it looks wildly different, I have a reason to question the extra events.
