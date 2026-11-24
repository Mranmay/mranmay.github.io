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
