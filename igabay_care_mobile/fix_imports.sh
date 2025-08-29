#!/bin/bash

# Import Fix Script for IgabayCare Flutter Project
# This script removes duplicate imports and organizes them properly

echo "🧹 Starting import cleanup for IgabayCare Flutter project..."

PROJECT_DIR="c:/Users/Ariane/Documents/CapstoneProject/MediClinic_Repo/igabay_care_mobile"
LIB_DIR="$PROJECT_DIR/lib"

# Change to project directory
cd "$PROJECT_DIR" || exit 1

echo "📁 Working directory: $(pwd)"

# Function to fix imports in a single file
fix_imports() {
    local file="$1"
    echo "🔧 Processing: $file"
    
    # Create temporary file
    temp_file=$(mktemp)
    
    # Remove duplicate imports and organize
    awk '
    BEGIN { 
        in_imports = 1
        dart_imports = ""
        flutter_imports = ""
        package_imports = ""
        project_imports = ""
        other_lines = ""
    }
    /^import / {
        if (!seen[$0]++) {
            if ($0 ~ /dart:/) {
                dart_imports = dart_imports $0 "\n"
            } else if ($0 ~ /package:flutter\//) {
                flutter_imports = flutter_imports $0 "\n"
            } else if ($0 ~ /package:/) {
                package_imports = package_imports $0 "\n"
            } else {
                project_imports = project_imports $0 "\n"
            }
        }
        next
    }
    /^$/ && in_imports {
        next
    }
    {
        in_imports = 0
        other_lines = other_lines $0 "\n"
    }
    END {
        # Print organized imports
        if (dart_imports) print dart_imports
        if (flutter_imports) print flutter_imports
        if (package_imports) print package_imports
        if (project_imports) print project_imports
        printf "%s", other_lines
    }
    ' "$file" > "$temp_file"
    
    # Replace original file
    mv "$temp_file" "$file"
}

# Find and fix all Dart files
echo "🔍 Finding Dart files..."
find "$LIB_DIR" -name "*.dart" -type f | while read -r file; do
    # Check if file has import statements
    if grep -q "^import " "$file"; then
        fix_imports "$file"
    fi
done

echo "✨ Import cleanup completed!"

# Run Flutter commands
echo "🔄 Running Flutter commands..."
flutter clean
flutter pub get

echo "✅ All done! Your imports should now be clean and organized."
echo ""
echo "📋 Next steps:"
echo "1. Restart your IDE"
echo "2. Check if import errors are resolved"
echo "3. Run 'flutter analyze' to verify no issues remain"