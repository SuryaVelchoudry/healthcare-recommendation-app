import os
import sys

def main():
    print("Setting up Healthcare Recommendation System Backend...")
    
    models_dir = os.path.join(os.path.dirname(__file__), "ml", "models")
    if not os.path.exists(models_dir):
        os.makedirs(models_dir)
        
    clf_path = os.path.join(models_dir, "disease_classifier.pkl")
    if not os.path.exists(clf_path):
        print("Models not found. Generating synthetic data...")
        from ml import data_generator
        data_generator.main()
        
        print("\nTraining models...")
        from ml import train_models
        train_models.main()
        
        print("\nModels trained successfully!")
    else:
        print("Models already exist. Skipping training.")
        
    print("\nBackend setup complete. You can now run the server with: uvicorn api.main:app --reload")

if __name__ == "__main__":
    main()
