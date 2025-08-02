"use client";

import React, { useState, useEffect } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  useDraggable,
  useDroppable,
  MeasuringStrategy,
  DragOverEvent,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

interface FileItem {
  id: string;
  name: string;
  type: "file";
}

interface FolderItem {
  id: string;
  name: string;
  type: "folder";
  files: string[];
}

type Item = FileItem | FolderItem;

const DraggableItem: React.FC<{
  item: Item;
  onItemClick: (item: Item) => void;
}> = ({ item, onItemClick }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: item.id,
      data: item,
    });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  const handleClick = (e: React.MouseEvent) => {
    // Prevent click during drag
    if (isDragging) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    onItemClick(item);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleClick}
      className={`
        p-3 mb-2 rounded-lg border cursor-pointer select-none transition-all duration-200
        ${
          item.type === "file"
            ? "bg-blue-50 border-blue-200 hover:bg-blue-100"
            : "bg-green-50 border-green-200 hover:bg-green-100"
        }
        ${isDragging ? "shadow-lg scale-105" : "shadow-sm hover:shadow-md"}
      `}
      suppressHydrationWarning
    >
      <div className="flex items-center gap-2">
        <span className="text-lg">{item.type === "file" ? "📄" : "📁"}</span>
        <span className="font-medium">{item.name}</span>
        {item.type === "folder" && item.files.length > 0 && (
          <span className="text-xs text-gray-500">
            ({item.files.length} files)
          </span>
        )}
      </div>
    </div>
  );
};

const DragOverlayItem: React.FC<{ item: Item }> = ({ item }) => {
  return (
    <div className="p-3 mb-2 rounded-lg border cursor-pointer select-none bg-white shadow-xl">
      <div className="flex items-center gap-2">
        <span className="text-lg">{item.type === "file" ? "📄" : "📁"}</span>
        <span className="font-medium">{item.name}</span>
        {item.type === "folder" && item.files.length > 0 && (
          <span className="text-xs text-gray-500">
            ({item.files.length} files)
          </span>
        )}
      </div>
    </div>
  );
};

const DroppableContainer: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: "droppable-container",
  });

  return (
    <div
      ref={setNodeRef}
      className={`
        min-h-[400px] p-4 border-2 border-dashed rounded-lg transition-colors duration-200
        ${
          isOver ? "border-green-400 bg-green-50" : "border-gray-300 bg-gray-50"
        }
      `}
      suppressHydrationWarning
    >
      {children}
    </div>
  );
};

const dragTest = () => {
  const [mounted, setMounted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [items, setItems] = useState<Item[]>([
    { id: "file-1", name: "Document.pdf", type: "file" },
    { id: "file-2", name: "Image.jpg", type: "file" },
    { id: "file-3", name: "Video.mp4", type: "file" },
    { id: "folder-1", name: "Work", type: "folder", files: [] },
    { id: "folder-2", name: "Personal", type: "folder", files: [] },
    { id: "folder-3", name: "Archive", type: "folder", files: [] },
  ]);

  const [activeItem, setActiveItem] = useState<Item | null>(null);
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({
    message: "",
    visible: false,
  });

  // Configure sensors with activation constraints
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor)
  );

  // Ensure component only renders on client side
  useEffect(() => {
    setMounted(true);
  }, []);

  const showToast = (message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast({ message: "", visible: false }), 3000);
  };

  const handleItemClick = (item: Item) => {
    // Don't trigger click if we're currently dragging
    if (isDragging) return;

    if (item.type === "file") {
      showToast(`Clicked on file: ${item.name}`);
    } else {
      showToast(`Clicked on folder: ${item.name}`);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const item = active.data.current as Item;
    if (item) {
      setActiveItem(item);
      setIsDragging(true);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveItem(null);
    setIsDragging(false);

    if (!over) return;

    const draggedItem = active.data.current as Item;
    const targetItem = over.data.current as Item;

    // Add null checks to prevent runtime errors
    if (!draggedItem || !targetItem) return;

    // Only allow dropping files into folders
    if (draggedItem.type === "file" && targetItem.type === "folder") {
      setItems((prevItems) => {
        const newItems = prevItems.map((item) => {
          if (item.id === targetItem.id && item.type === "folder") {
            return {
              ...item,
              files: [...item.files, draggedItem.id],
            };
          }
          return item;
        });

        // Remove the file from the main list since it's now in a folder
        return newItems.filter((item) => item.id !== draggedItem.id);
      });

      showToast(`Moved ${draggedItem.name} to ${targetItem.name}`);
    }
  };

  // Don't render until mounted to prevent hydration issues
  if (!mounted) {
    return (
      <div className="p-6 max-w-md mx-auto">
        <h2 className="text-2xl font-bold mb-4 text-center">File Manager</h2>
        <div className="min-h-[400px] p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 flex items-center justify-center">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-center">File Manager</h2>
      <p className="text-sm text-gray-600 mb-4 text-center">
        Click items to see details • Drag files to folders (250ms delay, 5px
        tolerance)
      </p>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        measuring={{
          droppable: {
            strategy: MeasuringStrategy.Always,
          },
        }}
      >
        <DroppableContainer>
          {items.map((item) => (
            <DraggableItem
              key={item.id}
              item={item}
              onItemClick={handleItemClick}
            />
          ))}
        </DroppableContainer>

        <DragOverlay>
          {activeItem ? <DragOverlayItem item={activeItem} /> : null}
        </DragOverlay>
      </DndContext>

      {/* Toast Notification */}
      {toast.visible && (
        <div className="fixed bottom-4 right-4 bg-black text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-in slide-in-from-bottom-2">
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default dragTest;
