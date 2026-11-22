type ResearchFigure = {
  src: string;
  width: number;
  height: number;
  alt: string;
  caption: string;
  credit: string;
  source?: string;
  license?: { label: string; url: string };
};

export const researchFigures: Record<
  "visual-cortex" | "spike-inference" | "calcium-models" | "retinal-computation",
  ResearchFigure
> = {
  "visual-cortex": {
    src: "/images/research/microns-target-reconstructions.webp",
    width: 1200,
    height: 829,
    alt: "Four reconstructed pyramidal neurons with synapses colored by the layer of the incoming cell.",
    caption: "Reconstructed targets from layers 2/3, 4 and 5 share a physical scale. Dots mark synaptic input from each source layer.",
    credit: "Mranmay Shetty, MSc report, Fig. 5. Reconstructions from the MICrONS Consortium.",
    source: "https://www.microns-explorer.org/cortical-mm3",
    license: { label: "MICrONS data · CC BY 4.0", url: "https://creativecommons.org/licenses/by/4.0/" },
  },
  "spike-inference": {
    src: "/images/research/spike-inference-calibration.webp",
    width: 1200,
    height: 800,
    alt: "Time-aligned OASIS, FastL0 and CASCADE outputs with the recorded spikes and three inferred event rasters for one neuron.",
    caption: "Three inference methods on the same Allen calibration recording. The electrophysiology raster gives a common reference for their inferred events.",
    credit: "Mranmay Shetty, MSc internship report, Fig. 8. Allen Institute calibration data.",
    source: "https://brain-map.org/our-research/circuits-behavior/ophys-ephys-calibration-data",
  },
  "calcium-models": {
    src: "/images/research/calcium-decay-example.svg",
    width: 820,
    height: 440,
    alt: "Two calcium traces respond to the same spike pair and decay at different rates. The slower model retains more signal between frames.",
    caption: "Two spikes, two decay rates. Each model receives identical events at frames 1 and 3, but carries different amounts of calcium into the next frame.",
    credit: "Illustrative simulation from the calcium dynamics research note.",
  },
  "retinal-computation": {
    src: "/images/research/retina-photoreceptor-cnn.webp",
    width: 1200,
    height: 397,
    alt: "Movie frames pass through a photoreceptor layer and three convolutional layers to predict retinal ganglion-cell spike rates.",
    caption: "A model I reviewed places photoreceptor adaptation ahead of a convolutional network to predict ganglion-cell responses.",
    credit: "Idrees et al., Nature Communications (2024), Fig. 1b. Panel cropped from Fig. 1.",
    source: "https://www.nature.com/articles/s41467-024-50114-5/figures/1",
    license: { label: "CC BY 4.0", url: "https://creativecommons.org/licenses/by/4.0/" },
  },
};

export const spikeGallery: ResearchFigure[] = [
  {
    "src": "/images/research/spike-workflow.webp",
    "width": 760,
    "height": 890,
    "alt": "Workflow diagram connecting calcium preprocessing to spike inference, ground-truth evaluation and repeat analysis.",
    "caption": "The analysis branches into calibration against electrophysiology and motif analysis across repeated movie presentations.",
    "credit": "Mranmay Shetty, MSc internship report, Methods."
  },
  {
    "src": "/images/research/spike-event-detection.webp",
    "width": 1080,
    "height": 600,
    "alt": "Overlaid per-recording F1 histograms for OASIS/Suite2p, FastL0 and CASCADE.",
    "caption": "Event F1 across calibration recordings.",
    "credit": "Mranmay Shetty, MSc internship report, Fig. 9."
  },
  {
    "src": "/images/research/spike-rate-correlation.webp",
    "width": 1080,
    "height": 600,
    "alt": "Distributions of the inferred-rate correlation for each method.",
    "caption": "Correlation of inferred rates with binned electrical spike counts.",
    "credit": "Mranmay Shetty, MSc internship report, Fig. 10."
  },
  {
    "src": "/images/research/spike-rate-calibration.webp",
    "width": 1080,
    "height": 600,
    "alt": "Histograms of negative log-likelihood per spike for the three methods.",
    "caption": "Poisson negative log-likelihood per recorded spike.",
    "credit": "Mranmay Shetty, MSc internship report, Fig. 11."
  },
  {
    "src": "/images/research/spike-spike-timing.webp",
    "width": 1080,
    "height": 600,
    "alt": "Distributions of the spike-timing error metric for the three methods.",
    "caption": "Victor–Purpura distance per spike.",
    "credit": "Mranmay Shetty, MSc internship report, Fig. 12."
  },
  {
    "src": "/images/research/spike-repeat-response.webp",
    "width": 1080,
    "height": 450,
    "alt": "A repeat-averaged population response heatmap with cells arranged by Rastermap.",
    "caption": "Natural movie responses ordered using the training repeats.",
    "credit": "Mranmay Shetty, MSc internship report, Fig. 13."
  },
  {
    "src": "/images/research/spike-held-out-repeats.webp",
    "width": 1080,
    "height": 450,
    "alt": "Held-out repeat-averaged neural activity plotted in the training-set cell order.",
    "caption": "The same ordering applied to held-out repeats of the movie.",
    "credit": "Mranmay Shetty, MSc internship report, Fig. 14."
  },
  {
    "src": "/images/research/spike-foopsi-comparison.webp",
    "width": 1080,
    "height": 740,
    "alt": "Calcium recording, OASIS and FOOPSI estimates, electrical spikes and detected-event rasters.",
    "caption": "OASIS and FOOPSI on the same calcium trace. FOOPSI returned near-zero output under the tested settings in this example.",
    "credit": "Mranmay Shetty, MSc internship report, Supplementary Fig. S1."
  },
  {
    "src": "/images/research/spike-repeat-counts.webp",
    "width": 1080,
    "height": 425,
    "alt": "Two bar charts compare detected spikes and active neurons across movie repeats.",
    "caption": "Before comparing repeats with SpikeShip, I checked how inferred event counts and the number of participating neurons varied across repeats.",
    "credit": "Mranmay Shetty, MSc internship report, Supplementary repeat diagnostic."
  },
  {
    "src": "/images/research/spike-seqnmf-cost.webp",
    "width": 1080,
    "height": 324,
    "alt": "seqNMF reconstruction cost against iteration showing an early drop followed by a plateau.",
    "caption": "The seqNMF reconstruction cost plateaued almost immediately. This run did not establish a stable set of repeating sequences.",
    "credit": "Mranmay Shetty, MSc internship report, Supplementary seqNMF diagnostic."
  },
  {
    "src": "/images/research/spike-motif-routes.webp",
    "width": 1041,
    "height": 532,
    "alt": "Three proposed routes compare spike-first, calcium-native and paired analyses.",
    "caption": "Proposed extension: compare motifs recovered from inferred spikes and from continuous calcium activity on the same recordings.",
    "credit": "Mranmay Shetty, MSc internship report, Fig. 15."
  },
  {
    "src": "/images/research/spike-motif-core-flow.webp",
    "width": 1062,
    "height": 563,
    "alt": "Illustrative network of peripheral and core cells with arrows representing hypothetical directed relationships.",
    "caption": "Proposed extension: use motif-restricted windows to test for directed relationships among participating neurons.",
    "credit": "Mranmay Shetty, MSc internship report, Fig. 16."
  }
];
