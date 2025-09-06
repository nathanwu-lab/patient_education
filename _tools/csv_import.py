#!/usr/bin/env python3
"""
CSV Import Tool for Treatment Handout Builder
Converts your CSV file to the required format
"""

import csv
import json
import os
import sys

def convert_csv_to_medication_data(input_csv_path, output_csv_path):
    """
    Convert your CSV to the medication_data.csv format
    """
    print(f"Reading CSV from: {input_csv_path}")
    
    # Read your CSV file
    with open(input_csv_path, 'r', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        rows = list(reader)
    
    print(f"Found {len(rows)} medications")
    print("Column headers:", list(rows[0].keys()) if rows else "No data")
    
    # Map your columns to the required format
    # Update these mappings based on your CSV column names
    column_mapping = {
        'medication_name': 'medication_name',  # or 'name', 'drug_name', etc.
        'type': 'type',                        # or 'medication_type', 'category', etc.
        'default_directions': 'default_directions',  # or 'directions', 'instructions', etc.
        'side_effects': 'side_effects'         # or 'adverse_effects', 'side_effects', etc.
    }
    
    # Convert to required format
    converted_rows = []
    for row in rows:
        converted_row = {
            'medication_name': row.get(column_mapping['medication_name'], ''),
            'type': row.get(column_mapping['type'], ''),
            'default_directions': row.get(column_mapping['default_directions'], ''),
            'side_effects': row.get(column_mapping['side_effects'], '')
        }
        converted_rows.append(converted_row)
    
    # Write to medication_data.csv
    with open(output_csv_path, 'w', newline='', encoding='utf-8') as file:
        fieldnames = ['medication_name', 'type', 'default_directions', 'side_effects']
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(converted_rows)
    
    print(f"Converted CSV saved to: {output_csv_path}")
    print("Sample converted data:")
    for i, row in enumerate(converted_rows[:3]):
        print(f"  {i+1}. {row}")

def main():
    if len(sys.argv) != 2:
        print("Usage: python csv_import.py <your_csv_file.csv>")
        print("Example: python csv_import.py my_medications.csv")
        return
    
    input_file = sys.argv[1]
    output_file = os.path.join('data', 'medication_data.csv')
    
    if not os.path.exists(input_file):
        print(f"Error: File '{input_file}' not found")
        return
    
    try:
        convert_csv_to_medication_data(input_file, output_file)
        print("\n✅ Import complete! Your CSV has been converted.")
        print("The website will now use your medication data.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
