import fitz
import os

def build_5page_lecture_pdf(output_path):
    doc = fitz.open()

    slides_content = [
        {
            "slide_no": 1,
            "title": "CS402: Introduction to Neural Networks",
            "subtitle": "Department of Computer Science — Lecture 01",
            "section": "1. Foundations of Artificial Intelligence",
            "bullets": [
                "Artificial intelligence has evolved from symbolic expert systems into data-driven statistical learning models.",
                "Modern machine learning focuses on creating algorithms that automatically discover patterns from historical data.",
                "Recent breakthroughs are driven by the confluence of massive web-scale datasets and specialized GPU accelerators.",
                "Deep learning representations eliminate the need for manual feature engineering across complex unstructured domains."
            ]
        },
        {
            "slide_no": 2,
            "title": "Core Learning Paradigms",
            "subtitle": "Taxonomy of Machine Learning Approaches",
            "section": "2. Supervised vs. Unsupervised Learning",
            "bullets": [
                "Supervised learning requires large annotated training datasets where each sample has a verified ground-truth label.",
                "Prominent supervised tasks include classification for discrete categories and continuous value regression.",
                "Unsupervised learning discovers latent clustering structures, probability distributions, and dimensional representations.",
                "Self-supervised learning leverages unlabeled data by creating auxiliary pretext tasks to train foundation models."
            ]
        },
        {
            "slide_no": 3,
            "title": "Anatomy of an Artificial Neuron",
            "subtitle": "Mathematical Formulation & Activation Functions",
            "section": "3. The Perceptron and Forward Propagation",
            "bullets": [
                "Each artificial neuron computes a weighted sum of its inputs, adds a learnable scalar bias, and applies an activation function.",
                "Non-linear activation functions allow multilayer neural networks to learn intricate non-linear decision boundaries.",
                "The Rectified Linear Unit (ReLU) is widely preferred because it prevents gradient saturation during backpropagation.",
                "The Universal Approximation Theorem demonstrates that feedforward networks can approximate any continuous function."
            ]
        },
        {
            "slide_no": 4,
            "title": "Optimization & Gradient Descent",
            "subtitle": "Training Multilayer Perceptrons with Backpropagation",
            "section": "4. Minimizing the Objective Loss Function",
            "bullets": [
                "A loss function evaluates the discrepancy between model predictions and true observed target values.",
                "Backpropagation calculates exact analytical gradients of the loss with respect to all network weights via the chain rule.",
                "Stochastic Gradient Descent (SGD) updates model parameters iteratively using randomized mini-batches of training examples.",
                "Adaptive optimizers such as Adam dynamically scale learning rates for individual parameters to accelerate training convergence."
            ]
        },
        {
            "slide_no": 5,
            "title": "Generalization & Overfitting Control",
            "subtitle": "Key Takeaways and Next Week's Agenda",
            "section": "5. Practical Summary and Discussion",
            "bullets": [
                "Overfitting occurs when a model memorizes idiosyncrasies and noise in the training set rather than underlying rules.",
                "Regularization techniques such as Dropout, L2 Weight Decay, and Data Augmentation enhance generalization on unseen tests.",
                "Careful hyperparameter tuning and learning rate scheduling are essential for achieving stable numerical convergence.",
                "Next Lecture: Convolutional Neural Networks (CNNs) for Computer Vision and Medical Image Segmentation."
            ]
        }
    ]

    width, height = 720, 540  # Standard 4:3 slide format

    for slide in slides_content:
        page = doc.new_page(width=width, height=height)

        # 1. Header background banner
        header_rect = fitz.Rect(0, 0, width, 90)
        page.draw_rect(header_rect, color=None, fill=(0.12, 0.23, 0.45))

        # 2. Slide Number Badge
        page.draw_circle(fitz.Point(width - 45, 45), 18, color=None, fill=(0.20, 0.35, 0.65))
        page.insert_text(fitz.Point(width - 50, 51), str(slide["slide_no"]), fontsize=14, color=(1, 1, 1))

        # 3. Slide Title & Subtitle in header
        page.insert_text(fitz.Point(40, 42), slide["title"], fontsize=20, color=(1, 1, 1))
        page.insert_text(fitz.Point(40, 68), slide["subtitle"], fontsize=12, color=(0.80, 0.88, 1.0))

        # 4. Section Heading
        page.insert_text(fitz.Point(45, 135), slide["section"], fontsize=16, color=(0.15, 0.25, 0.50))

        # Subtle decorative line below section heading
        page.draw_line(fitz.Point(45, 145), fitz.Point(width - 45, 145), color=(0.85, 0.88, 0.95), width=1.5)

        # 5. Bullet Points with realistic line-wrapping
        y_pos = 185
        for bullet in slide["bullets"]:
            # Draw decorative bullet marker
            bullet_box = fitz.Rect(50, y_pos - 10, 58, y_pos - 2)
            page.draw_rect(bullet_box, color=None, fill=(0.15, 0.40, 0.85))

            # Insert text with automatic visual wrap
            text_rect = fitz.Rect(72, y_pos - 14, width - 50, y_pos + 45)
            rc = page.insert_textbox(text_rect, bullet, fontsize=14, color=(0.15, 0.15, 0.18), lineheight=1.4)
            y_pos += 68

        # 6. Footer banner
        footer_rect = fitz.Rect(0, height - 30, width, height)
        page.draw_rect(footer_rect, color=None, fill=(0.95, 0.96, 0.98))
        page.draw_line(fitz.Point(0, height - 30), fitz.Point(width, height - 30), color=(0.88, 0.90, 0.94), width=1)
        page.insert_text(fitz.Point(45, height - 12), "LITH Lecture Translation Platform — Sample Academic Slide Deck", fontsize=9, color=(0.50, 0.55, 0.60))
        page.insert_text(fitz.Point(width - 95, height - 12), f"Page {slide['slide_no']} of 5", fontsize=9, color=(0.40, 0.45, 0.50))

    doc.save(output_path)
    doc.close()
    print(f"Successfully generated 5-page lecture PDF: {output_path}")

if __name__ == "__main__":
    out_file = os.path.abspath("Lecture_Neural_Networks_5Pages.pdf")
    build_5page_lecture_pdf(out_file)
