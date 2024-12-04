import os
import sys
from alembic import command
from alembic.config import Config

def run_migrations():
    # Get the directory containing this script
    current_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Create an Alembic configuration object
    alembic_cfg = Config(os.path.join(current_dir, "alembic.ini"))
    
    try:
        # Run the migration
        command.upgrade(alembic_cfg, "head")
        print("Migration completed successfully!")
    except Exception as e:
        print(f"Error during migration: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    run_migrations()
