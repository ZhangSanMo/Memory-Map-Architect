
# Memory Map Architect Pro

A dedicated tool for low-level software engineers and embedded systems developers to plan, visualize, and document memory space allocation.

## Features

- **High-Precision Address Calculation**: Uses `BigInt` to handle 32-bit and 64-bit address spaces without floating-point errors.
- **Bi-Directional Derivation**: Automatically calculates the third value when you provide any two of: Start Address, End Address, or Size.
- **Human-Readable Sizes**: Supports input and output in standard formats like `4KB`, `2.5MB`, `1GB`, etc.
- **Real-Time Visualization**: A vertical physical layout preview that highlights unmapped gaps and overlapping regions.
- **Sequential Hinting**: Automatically suggests the next available address based on the end of the previous block, facilitating rapid sequential entry.
- **Markdown Export**: Generate professional documentation tables for implementation files or hardware specs.

## Tech Stack

- **React 19**: Modern UI component management.
- **Tailwind CSS**: Clean, dark-mode professional aesthetic.
- **TypeScript**: Type-safe address manipulation.
- **Vite**: Ultra-fast build and development environment.

## Usage

1. Enter a **Block Name** (e.g., `SRAM_L1`) and select its **Type**.
2. Provide two address parameters (e.g., **Start Address** and **Size**).
3. The system will automatically derive the **End Address**.
4. Click **Commit** to save to the table and visualize the physical layout.
5. Use the **Export Table** button to copy a Markdown version for your documentation.
