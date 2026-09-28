import os
import fitz
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np

def generate_diagrams(output_dir):
    os.makedirs(output_dir, exist_ok=True)
    paths = []

    # 1. Diagram 1: Agent Architecture
    fig, ax = plt.subplots(figsize=(6, 3.5), dpi=150)
    fig.patch.set_facecolor('#f8fafc')
    ax.set_facecolor('#f8fafc')
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 6)
    ax.axis('off')

    # Draw boxes
    boxes = [
        ("Perception Engine\n(Sensors & Vision)", 2, 4.4, '#3b82f6'),
        ("Reasoning & Planning\n(LLM & Memory)", 5, 4.4, '#8b5cf6'),
        ("Action Execution\n(Tools & Actuators)", 8, 4.4, '#10b981'),
        ("Environment / Context Feedback", 5, 0.9, '#f59e0b')
    ]
    for text, cx, cy, col in boxes:
        bbox = dict(boxstyle="round,pad=0.6,rounding_size=0.3", fc=col, ec="none", alpha=0.9)
        ax.text(cx, cy, text, ha='center', va='center', color='white', weight='bold', fontsize=8.5, bbox=bbox)

    # Arrows
    arrow_props = dict(arrowstyle="->", lw=2, color="#475569")
    ax.annotate("", xy=(3.6, 4.4), xytext=(3.4, 4.4), arrowprops=arrow_props)
    ax.annotate("", xy=(6.6, 4.4), xytext=(6.4, 4.4), arrowprops=arrow_props)
    ax.annotate("", xy=(8, 1.8), xytext=(8, 3.6), arrowprops=arrow_props)
    ax.annotate("", xy=(2, 3.6), xytext=(2, 1.8), arrowprops=arrow_props)
    ax.annotate("", xy=(3.3, 0.9), xytext=(2.2, 1.6), arrowprops=dict(arrowstyle="<-", lw=2, color="#475569"))
    ax.annotate("", xy=(6.7, 0.9), xytext=(7.8, 1.6), arrowprops=dict(arrowstyle="->", lw=2, color="#475569"))

    ax.text(5, 5.6, "Autonomous Feedback Loop Architecture", ha='center', weight='bold', fontsize=11, color='#0f172a')
    plt.tight_layout()
    d1_path = os.path.join(output_dir, "diag_agent_architecture.png")
    plt.savefig(d1_path, facecolor=fig.get_facecolor(), bbox_inches='tight')
    plt.close()
    paths.append(d1_path)

    # 2. Diagram 2: Learning Paradigms Taxonomy
    fig, ax = plt.subplots(figsize=(6, 3.5), dpi=150)
    fig.patch.set_facecolor('#f8fafc')
    ax.set_facecolor('#f8fafc')
    
    categories = ['Supervised\n(Classification)', 'Unsupervised\n(Clustering)', 'Reinforcement\n(Policy RL)']
    sample_sizes = [85, 60, 92]
    colors = ['#2563eb', '#7c3aed', '#059669']
    
    bars = ax.bar(categories, sample_sizes, color=colors, width=0.55, edgecolor='#1e293b', linewidth=0.8)
    ax.set_ylabel('Sample Efficiency Score', fontsize=9, weight='bold', color='#334155')
    ax.set_title('Machine Learning Paradigms: Efficiency & Autonomy', fontsize=10.5, weight='bold', color='#0f172a', pad=12)
    ax.set_ylim(0, 105)
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.spines['left'].set_color('#94a3b8')
    ax.spines['bottom'].set_color('#94a3b8')
    ax.tick_params(colors='#334155', labelsize=8.5)
    
    for bar in bars:
        h = bar.get_height()
        ax.text(bar.get_x() + bar.get_width()/2., h + 2, f'{h}%', ha='center', va='bottom', fontsize=8.5, weight='bold', color='#1e293b')

    plt.tight_layout()
    d2_path = os.path.join(output_dir, "diag_learning_paradigms.png")
    plt.savefig(d2_path, facecolor=fig.get_facecolor(), bbox_inches='tight')
    plt.close()
    paths.append(d2_path)

    # 3. Diagram 3: Convolutional Neural Network Feature Maps
    fig, ax = plt.subplots(figsize=(6, 3.5), dpi=150)
    fig.patch.set_facecolor('#f8fafc')
    ax.set_facecolor('#f8fafc')
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 5)
    ax.axis('off')

    # Draw layers
    stages = [
        ("Input Image\n(256x256)", 1.2, 2.5, 1.4, 2.0, '#3b82f6'),
        ("Conv + ReLU\n(Feature Maps)", 4.0, 2.5, 1.2, 1.6, '#8b5cf6'),
        ("Max Pooling\n(Downsampling)", 6.6, 2.5, 1.0, 1.2, '#ec4899'),
        ("Fully Connected\n(Classification)", 9.0, 2.5, 0.6, 2.2, '#10b981')
    ]
    for name, cx, cy, w, h, col in stages:
        rect = plt.Rectangle((cx - w/2, cy - h/2), w, h, facecolor=col, edgecolor='#1e293b', alpha=0.85, lw=1.2)
        ax.add_patch(rect)
        ax.text(cx, cy - h/2 - 0.5, name, ha='center', va='top', fontsize=8, weight='bold', color='#1e293b')

    ax.annotate("", xy=(2.2, 2.5), xytext=(3.1, 2.5), arrowprops=dict(arrowstyle="<-", lw=1.8, color="#475569"))
    ax.annotate("", xy=(4.9, 2.5), xytext=(5.8, 2.5), arrowprops=dict(arrowstyle="<-", lw=1.8, color="#475569"))
    ax.annotate("", xy=(7.4, 2.5), xytext=(8.4, 2.5), arrowprops=dict(arrowstyle="<-", lw=1.8, color="#475569"))
    ax.text(5, 4.6, "Deep Convolutional Feature Representation Pipeline", ha='center', weight='bold', fontsize=10.5, color='#0f172a')
    
    plt.tight_layout()
    d3_path = os.path.join(output_dir, "diag_cnn_pipeline.png")
    plt.savefig(d3_path, facecolor=fig.get_facecolor(), bbox_inches='tight')
    plt.close()
    paths.append(d3_path)

    # 4. Diagram 4: Loss Convergence & Generalization Gap
    fig, ax = plt.subplots(figsize=(6, 3.5), dpi=150)
    fig.patch.set_facecolor('#f8fafc')
    ax.set_facecolor('#f8fafc')

    epochs = np.linspace(1, 50, 100)
    train_loss = 2.5 * np.exp(-epochs / 12) + 0.15
    val_loss = 2.5 * np.exp(-epochs / 14) + 0.18 + 0.00035 * (epochs - 20)**2 * (epochs > 20)

    ax.plot(epochs, train_loss, label='Training Loss', color='#2563eb', lw=2.2)
    ax.plot(epochs, val_loss, label='Validation Loss', color='#dc2626', lw=2.2, linestyle='--')
    ax.axvline(x=22, color='#16a34a', linestyle=':', lw=1.8, label='Optimal Early Stop')

    ax.set_xlabel('Epochs / Iterations', fontsize=8.5, weight='bold', color='#334155')
    ax.set_ylabel('Objective Loss Value', fontsize=8.5, weight='bold', color='#334155')
    ax.set_title('Optimization Dynamics & Generalization Gap', fontsize=10.5, weight='bold', color='#0f172a', pad=10)
    ax.legend(fontsize=8, frameon=True, facecolor='#ffffff', edgecolor='#cbd5e1')
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.spines['left'].set_color('#94a3b8')
    ax.spines['bottom'].set_color('#94a3b8')
    ax.tick_params(colors='#334155', labelsize=8)

    plt.tight_layout()
    d4_path = os.path.join(output_dir, "diag_loss_convergence.png")
    plt.savefig(d4_path, facecolor=fig.get_facecolor(), bbox_inches='tight')
    plt.close()
    paths.append(d4_path)

    return paths

def create_multiformat_pdf(output_pdf_path):
    temp_dir = os.path.join(os.path.dirname(output_pdf_path), "temp_diagrams")
    diagram_paths = generate_diagrams(temp_dir)

    # 720 x 540 (Standard 4:3 slide format)
    page_w, page_h = 720, 540
    doc = fitz.open()

    slides_content = [
        {
            "slide_num": 1,
            "title": "CS501: Autonomous Systems & Cognitive Agents",
            "subtitle": "Foundations of Artificial Intelligence • Lecture 01",
            "diagram": diagram_paths[0],
            # 1. سرد (Narrative)
            "narrative_title": "Conceptual Framework:",
            "narrative": "Modern autonomous agents perceive dynamic environments through continuous sensory input, formulate high-level multi-step plans using latent reasoning models, and execute targeted real-world actions in real time.",
            # 2. تعداد (Bulleted list)
            "bullets_title": "Primary Architectural Subsystems:",
            "bullets": [
                "• Perception Module processes multi-modal vision and sensor streams.",
                "• Working Memory maintains episodic history and context windows.",
                "• Action Planner executes tool-calling and external environment mutations."
            ],
            # 3. ملاحظات (Callout Note)
            "note_type": "Important Concept",
            "note": "Unlike standard classification models, autonomous agents operate in closed feedback loops where every action permanently alters the future environmental state."
        },
        {
            "slide_num": 2,
            "title": "Core Learning Paradigms & Algorithm Taxonomy",
            "subtitle": "Supervised, Unsupervised, and Policy Optimization",
            "diagram": diagram_paths[1],
            # 1. سرد (Narrative)
            "narrative_title": "Mathematical Overview:",
            "narrative": "Machine learning algorithms differ primarily in their supervision signal, optimization objective, and how feedback propagates through parameters during gradient descent updates.",
            # 2. تعداد (Bulleted list)
            "bullets_title": "Key Paradigms Comparison:",
            "bullets": [
                "• Supervised Learning minimizes empirical cross-entropy loss over labeled target pairs.",
                "• Unsupervised Learning uncovers latent manifold geometry without ground-truth labels.",
                "• Reinforcement Learning maximizes expected cumulative discounted future reward returns."
            ],
            # 3. ملاحظات (Callout Note)
            "note_type": "Technical Note",
            "note": "Reward hacking occurs when a policy exploits unintended loopholes in the reward function rather than achieving the intended optimization goal."
        },
        {
            "slide_num": 3,
            "title": "Deep Neural Architectures in Computer Vision",
            "subtitle": "Convolutional Feature Extractors & Representation Learning",
            "diagram": diagram_paths[2],
            # 1. سرد (Narrative)
            "narrative_title": "Hierarchical Representation Theory:",
            "narrative": "Deep convolutional networks automatically learn hierarchical representations, transitioning from low-level edges in early layers to high-level semantic object categories in deeper layers.",
            # 2. تعداد (Bulleted list)
            "bullets_title": "Core Advantages of Spatial Convolutions:",
            "bullets": [
                "• Local receptive fields preserve 2D spatial correlation between adjacent pixels.",
                "• Parameter weight sharing drastically reduces model footprint and overfitting.",
                "• Downsampling pooling operations provide translation and scale invariance."
            ],
            # 3. ملاحظات (Callout Note)
            "note_type": "Design Rule",
            "note": "Always maintain feature map dimensionality balance to avoid aggressive information bottlenecking before dense linear classification heads."
        },
        {
            "slide_num": 4,
            "title": "Optimization Dynamics & Generalization Control",
            "subtitle": "Preventing Overfitting via Regularization & Early Stopping",
            "diagram": diagram_paths[3],
            # 1. سرد (Narrative)
            "narrative_title": "Optimization Dynamics:",
            "narrative": "Training deep models requires balancing aggressive parameter convergence on training data while preserving broad generalization on unseen validation distributions.",
            # 2. تعداد (Bulleted list)
            "bullets_title": "Essential Regularization Techniques:",
            "bullets": [
                "• Weight Decay (L2 penalty) penalizes excessively large parameter magnitudes.",
                "• Dropout randomly zeroes activations to prevent complex co-adaptations.",
                "• Early Stopping checkpoints parameters when validation loss diverges."
            ],
            # 3. ملاحظات (Callout Note)
            "note_type": "Best Practice",
            "note": "A growing gap between training and validation loss indicates overfitting; immediately reduce learning rate or increase weight decay regularization."
        }
    ]

    font_path = "C:/Windows/Fonts/arial.ttf"
    font_bold = "C:/Windows/Fonts/arialbd.ttf"

    for slide in slides_content:
        page = doc.new_page(width=page_w, height=page_h)
        page.insert_font(fontname="Arial", fontfile=font_path)
        page.insert_font(fontname="ArialBold", fontfile=font_bold)

        # Header Bar
        hdr_rect = fitz.Rect(0, 0, page_w, 54)
        page.draw_rect(hdr_rect, color=None, fill=(0.08, 0.16, 0.32))

        page.insert_text(fitz.Point(30, 26), slide["title"], fontsize=13, fontname="ArialBold", color=(1, 1, 1))
        page.insert_text(fitz.Point(30, 42), slide["subtitle"], fontsize=9.5, fontname="Arial", color=(0.75, 0.85, 0.95))
        page.insert_text(fitz.Point(page_w - 90, 32), f"Slide {slide['slide_num']} / 4", fontsize=11, fontname="ArialBold", color=(0.85, 0.92, 1.0))

        # LEFT COLUMN: Diagram + Narrative (سرد)
        left_x = 30
        left_w = 320

        # Insert Diagram
        diag_rect = fitz.Rect(left_x, 68, left_x + left_w, 68 + 195)
        page.insert_image(diag_rect, filename=slide["diagram"])
        page.draw_rect(diag_rect, color=(0.8, 0.85, 0.9), width=1)

        # 1. Narrative Section (سرد)
        nar_bg = fitz.Rect(left_x, 276, left_x + left_w, 276 + 120)
        page.draw_rect(nar_bg, color=(0.85, 0.90, 0.96), fill=(0.97, 0.985, 1.0), width=0.8)
        # Left blue bar
        page.draw_rect(fitz.Rect(left_x, 276, left_x + 4, 276 + 120), color=None, fill=(0.15, 0.40, 0.85))

        page.insert_text(fitz.Point(left_x + 12, 294), slide["narrative_title"], fontsize=10.5, fontname="ArialBold", color=(0.12, 0.25, 0.55))
        nar_text_rect = fitz.Rect(left_x + 12, 302, left_x + left_w - 12, 276 + 115)
        page.insert_textbox(nar_text_rect, slide["narrative"], fontsize=9.5, fontname="Arial", color=(0.18, 0.22, 0.30), lineheight=1.3)

        # RIGHT COLUMN: Bullets (تعداد) + Notes (ملاحظات)
        right_x = 370
        right_w = page_w - 30 - right_x

        # 2. Bullets Section (تعداد)
        page.insert_text(fitz.Point(right_x, 82), slide["bullets_title"], fontsize=11.5, fontname="ArialBold", color=(0.10, 0.20, 0.40))
        
        curr_y = 96
        for bullet in slide["bullets"]:
            b_rect = fitz.Rect(right_x, curr_y, right_x + right_w, curr_y + 44)
            # subtle card
            page.draw_rect(b_rect, color=(0.88, 0.91, 0.95), fill=(0.99, 1.0, 1.0), width=0.6)
            page.draw_rect(fitz.Rect(right_x, curr_y, right_x + 3, curr_y + 44), color=None, fill=(0.20, 0.50, 0.90))
            
            tb_rect = fitz.Rect(right_x + 10, curr_y + 4, right_x + right_w - 8, curr_y + 40)
            page.insert_textbox(tb_rect, bullet, fontsize=9.5, fontname="Arial", color=(0.15, 0.20, 0.28), lineheight=1.25)
            curr_y += 50

        # 3. Notes Section (ملاحظات / Callout box)
        note_y = curr_y + 12
        note_h = 115
        note_rect = fitz.Rect(right_x, note_y, right_x + right_w, note_y + note_h)
        # Amber/Yellow callout styling
        page.draw_rect(note_rect, color=(0.95, 0.80, 0.40), fill=(1.0, 0.985, 0.92), width=1)
        # Left amber accent bar
        page.draw_rect(fitz.Rect(right_x, note_y, right_x + 4, note_y + note_h), color=None, fill=(0.85, 0.55, 0.05))

        page.insert_text(fitz.Point(right_x + 12, note_y + 18), f"ALERT & NOTE: {slide['note_type']}", fontsize=10, fontname="ArialBold", color=(0.75, 0.40, 0.02))
        note_text_rect = fitz.Rect(right_x + 12, note_y + 26, right_x + right_w - 12, note_y + note_h - 8)
        page.insert_textbox(note_text_rect, slide["note"], fontsize=9.5, fontname="Arial", color=(0.25, 0.22, 0.15), lineheight=1.3)

        # Footer
        footer_line = fitz.Rect(30, page_h - 26, page_w - 30, page_h - 25)
        page.draw_rect(footer_line, color=None, fill=(0.88, 0.90, 0.94))
        page.insert_text(fitz.Point(30, page_h - 12), "CS501 Lecture Series • Academic AI & Machine Learning Deck", fontsize=8, fontname="Arial", color=(0.50, 0.55, 0.65))
        page.insert_text(fitz.Point(page_w - 100, page_h - 12), f"Slide {slide['slide_num']} of 4", fontsize=8, fontname="ArialBold", color=(0.40, 0.45, 0.55))

    os.makedirs(os.path.dirname(output_pdf_path), exist_ok=True)
    doc.save(output_pdf_path, deflate=True, garbage=4)
    doc.close()
    print(f"Generated multi-format lecture PDF: {output_pdf_path}")

if __name__ == "__main__":
    out_pdf = os.path.join(os.path.dirname(__file__), "uploads", "Academic_AI_Lecture_Visual_Notes.pdf")
    create_multiformat_pdf(out_pdf)
