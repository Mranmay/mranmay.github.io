import { papers } from "./papers";

export const projects = [
  {
    id: "visual-cortex",
    status: "Ongoing",
    title: "Mapping visual inputs onto dendrites",
    group: "With Federico Rossi · Istituto Italiano di Tecnologia, Rovereto",
    question: "Does a neuron receive information about different parts of a scene on different branches?",
    approach: "I use MICrONS to trace the inputs onto pyramidal cells in layer 2/3 of mouse visual cortex. Electron microscopy shows where a presynaptic cell makes contact. Visual responses from the same tissue tell me which part of the visual field that cell responds to.",
    detail: "I compare inputs to the basal dendrites near the cell body with inputs to the apical tuft closer to the cortical surface. I also test whether inputs with similar receptive fields cluster along the same branch more often than expected after shuffling them.",
    links: [{ label: "Explore the MICrONS dataset", href: "https://www.microns-explorer.org/" }],
  },
  {
    id: "calcium-models",
    status: "Ongoing",
    title: "Modeling calcium dynamics and spike timing",
    group: "Independent project",
    question: "When the same fluorescence transient is compatible with several spike trains, which event times should a model report?",
    approach: "I study how a spike train gives rise to a fluorescence trace, including the rise and decay of the indicator response. Building on that work, I’m developing my own machine-learning model to infer spike counts and event times from fluorescence. Several closely spaced spikes can merge into a single optical transient.",
    detail: "I use paired optical and electrical recordings to ask two different questions about an estimate. Did it recover the amount of activity? And did it place individual events close to the spikes recorded by the electrode?",
    links: [{ label: "Read my calcium dynamics note", href: "/blog/calcium-dynamics-models/" }],
  },
  {
    id: "visual-memory",
    status: "Ongoing",
    title: "How a model remembers an image",
    group: "With Gabriel Kreiman · Kreiman Lab",
    question: "Why can a model remember an image and still say “yes” to the wrong one?",
    approach: "I’m developing a shared working-memory model for five visual tasks. A cue tells it what the trial requires, such as retrieving a particular sample or deciding whether an image has appeared before. I vary which images recur and when they recur to see which histories lead to an error.",
    detail: "In our Déjà View preprint, seeing more intervening images led to more false alarms even when the target was equally recent. I’m continuing to investigate how the model uses its stored image representations to make these decisions.",
    links: [{ label: "Read the Déjà View preprint", href: papers.dejaView.href }],
  },
  {
    id: "spike-inference",
    status: "Completed",
    title: "Spike inference and motif discovery from two-photon calcium imaging",
    group: "With Laurent Perrinet and Bruno Cessac · CNRS–INT and Inria",
    question: "How reliably can I infer when a neuron fired, and can I find recurring patterns across a population watching the same movie?",
    approach: "I compared OASIS, CASCADE and FastL0 on Allen Institute recordings that pair two-photon imaging with electrical spike times from the same neuron. I scored each method on both the timing of individual events and how well it followed changes in firing rate.",
    detail: "For the motif analysis, I used separate population recordings during repeated presentations of a natural movie. I fit a Rastermap ordering on a subset of repeats and kept that cell order fixed for the rest. The held-out repeats still showed activity tied to particular moments in the movie. I also tested seqNMF to extract recurring sequences, but it did not recover stable motifs with the settings I tested.",
    links: [{ label: "Paired recordings used in the benchmark", href: "https://brain-map.org/our-research/circuits-behavior/ophys-ephys-calibration-data" }],
  },
  {
    id: "retinal-computation",
    status: "Completed",
    title: "Can a neural network capture retinal adaptation?",
    group: "With Bruno Cessac · Inria BIOVISION",
    question: "Can a network trained on natural scenes predict how the retina responds when the lighting changes?",
    approach: "In my MSc literature review, I compared models of retinal ganglion-cell responses with the biological circuits that shape them. I looked at how models handle changes in light and contrast, and how tests with moving stimuli reveal computations learned from natural scenes.",
    detail: "One study I examined added photoreceptor adaptation ahead of a convolutional network. That gave me a concrete way to ask when modeling part of the biology helps a network generalize to new light levels.",
    links: [
      { label: "Photoreceptor adaptation study", href: "https://doi.org/10.1038/s41467-024-50114-5" },
      { label: "Retinal responses to natural scenes", href: "https://doi.org/10.1016/j.neuron.2023.06.007" },
    ],
  },
] as const;

export type ProjectId = (typeof projects)[number]["id"];
