export const papers = {
  dejaView: {
    title: "Déjà View: A Shared Working-Memory Model for Visual Tasks",
    year: 2026,
    venue: "arXiv preprint",
    authors: "Mranmay Shetty and Gabriel Kreiman",
    href: "https://arxiv.org/abs/2611.23177",
    result: "A single model learned five visual memory tasks. It made more false alarms after seeing more images, even when the target was equally recent.",
  },
  turing: {
    title: "Turing-like tests for language and vision demonstrate a narrowing gap between humans and AI",
    year: 2026,
    venue: "Nature Human Behaviour",
    authors: "Mengmi Zhang, Elisa Pavarino, Xiao Liu, …, Mranmay Shetty, …, Gabriel Kreiman",
    href: "https://doi.org/10.1038/s41562-026-02590-6",
    result: "Across six tasks, even simple AI judges were better than people at telling human responses from machine responses.",
  },
  eigencam: {
    title: "Ensemble learning and EigenCAM-based feature analysis for improving the performance and explainability of object detection in drone imagery",
    year: 2025,
    venue: "Discover Applied Sciences",
    authors: "Gargi Joshi, Amey Joshi, Mranmay Shetty, Rahee Walambe, Ketan Kotecha, Fabio Scotti and Vincenzo Piuri",
    href: "https://doi.org/10.1007/s42452-025-06879-5",
    result: "Combining predictions improved object detection in aerial images. EigenCAM heatmaps showed which parts of an image contributed to a detection.",
  },
} as const;

export const featuredPaperIds = ["dejaView", "turing", "eigencam"] as const;
