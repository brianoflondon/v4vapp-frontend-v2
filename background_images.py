import os
import argparse

def list_files_in_folder(folder_path):
    file_names = [filename.split(".")[0] for filename in os.listdir(folder_path) if os.path.isfile(os.path.join(folder_path, filename))]
    return file_names

def format_output(file_names):
    formatted_output = "const backgroundImage = [\n"
    for name in file_names:
        formatted_output += f"  \"{name}\",\n"
    formatted_output += "]"
    return formatted_output

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="List file names in a folder.")
    parser.add_argument("folder_path", help="Path to the folder containing files.")

    args = parser.parse_args()
    folder_path = args.folder_path

    file_names = list_files_in_folder(folder_path)
    output = format_output(file_names)
    print(output)
