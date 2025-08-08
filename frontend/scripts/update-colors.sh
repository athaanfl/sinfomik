#!/bin/bash

# Script to uniformly update color schemes across all admin features

# Define the color mappings
declare -A color_mappings=(
    ["from-emerald-([0-9]+) to-cyan-([0-9]+)"]="from-blue-\1 to-indigo-\2"
    ["from-cyan-([0-9]+) to-emerald-([0-9]+)"]="from-indigo-\1 to-blue-\2"
    ["from-purple-([0-9]+) to-pink-([0-9]+)"]="from-indigo-\1 to-blue-\2"
    ["from-pink-([0-9]+) to-purple-([0-9]+)"]="from-blue-\1 to-indigo-\2"
    ["text-emerald-([0-9]+)"]="text-blue-\1"
    ["text-cyan-([0-9]+)"]="text-indigo-\1"
    ["text-purple-([0-9]+)"]="text-indigo-\1"
    ["text-pink-([0-9]+)"]="text-blue-\1"
    ["bg-emerald-([0-9]+)"]="bg-blue-\1"
    ["bg-cyan-([0-9]+)"]="bg-indigo-\1"
    ["bg-purple-([0-9]+)"]="bg-indigo-\1"
    ["bg-pink-([0-9]+)"]="bg-blue-\1"
)

# Files to process
files=(
    "c:/Users/Han/Documents/Form/sinfomik/frontend/src/features/admin/classManagement.js"
    "c:/Users/Han/Documents/Form/sinfomik/frontend/src/features/admin/studentClassEnroll.js"
    "c:/Users/Han/Documents/Form/sinfomik/frontend/src/features/admin/gradeManagement.js"
    "c:/Users/Han/Documents/Form/sinfomik/frontend/src/features/admin/capaianPembelajaranManagement.js"
    "c:/Users/Han/Documents/Form/sinfomik/frontend/src/features/admin/TASemester.js"
    "c:/Users/Han/Documents/Form/sinfomik/frontend/src/features/admin/classPromote.js"
)

echo "Applying unified blue-indigo color scheme to admin features..."

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "Processing: $file"
        # Apply color mappings
        for pattern in "${!color_mappings[@]}"; do
            replacement="${color_mappings[$pattern]}"
            sed -i "s/$pattern/$replacement/g" "$file" 2>/dev/null || true
        done
    else
        echo "File not found: $file"
    fi
done

echo "Color scheme update completed!"
