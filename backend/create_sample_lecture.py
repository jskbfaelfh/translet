import fitz
import os

def generate_sample_pdf(output_path="sample_lecture.pdf"):
    doc = fitz.open()

    # Slide 1 (Landscape 4:3)
    p1 = doc.new_page(width=720, height=540)
    p1.insert_text(fitz.Point(50, 70), "CS101: Introduction to Machine Learning", fontsize=24, color=(0.12, 0.3, 0.75))
    p1.insert_text(fitz.Point(50, 110), "Department of Computer Science — Academic Year 2026", fontsize=14, color=(0.4, 0.4, 0.4))
    
    p1.insert_text(fitz.Point(50, 180), "1. What is Machine Learning?", fontsize=18, color=(0.1, 0.1, 0.1))
    p1.insert_text(fitz.Point(70, 220), "• Machine learning is a modern branch of artificial intelligence.", fontsize=15)
    p1.insert_text(fitz.Point(70, 260), "• It enables computers to learn patterns directly from empirical datasets.", fontsize=15)
    p1.insert_text(fitz.Point(70, 300), "• Algorithms improve their accuracy automatically through experience.", fontsize=15)

    p1.insert_text(fitz.Point(50, 370), "2. Primary Paradigms:", fontsize=18, color=(0.1, 0.1, 0.1))
    p1.insert_text(fitz.Point(70, 410), "• Supervised learning utilizes labeled inputs and outputs.", fontsize=15)
    p1.insert_text(fitz.Point(70, 450), "• Unsupervised learning detects hidden structures without human guidance.", fontsize=15)

    # Slide 2
    p2 = doc.new_page(width=720, height=540)
    p2.insert_text(fitz.Point(50, 70), "Key Supervised Learning Algorithms", fontsize=24, color=(0.12, 0.3, 0.75))
    p2.insert_text(fitz.Point(50, 110), "Theoretical Overview & Practical Applications", fontsize=14, color=(0.4, 0.4, 0.4))

    p2.insert_text(fitz.Point(50, 180), "• Linear Regression predicts continuous numeric targets.", fontsize=16)
    p2.insert_text(fitz.Point(50, 225), "• Logistic Regression estimates probabilities for classification problems.", fontsize=16)
    p2.insert_text(fitz.Point(50, 270), "• Decision Trees recursively partition feature space into pure subsets.", fontsize=16)
    p2.insert_text(fitz.Point(50, 315), "• Deep Neural Networks approximate complex non-linear functions.", fontsize=16)
    p2.insert_text(fitz.Point(50, 360), "• Cross-validation prevents overfitting and assesses generalizability.", fontsize=16)

    doc.save(output_path)
    doc.close()
    print(f"Sample lecture PDF generated at: {output_path}")

if __name__ == "__main__":
    generate_sample_pdf()
