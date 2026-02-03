import { createFileRoute } from "@tanstack/react-router"
import { Download, Image as ImageIcon, Sparkles, Upload, Wand2, X } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { useRef, useState } from "react"
import { Button } from "@/shared/components/ui/button"
import { Card, CardContent } from "@/shared/components/ui/card"
import { cn } from "@/shared/lib/utils"

export const Route = createFileRoute("/{-$locale}/test/")({
  component: AnimePhotoPage,
})

function AnimePhotoPage() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const imageUrl = URL.createObjectURL(file)
      setSelectedImage(imageUrl)
      setGeneratedImage(null) // Reset generated image on new upload
    }
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    const file = event.dataTransfer.files?.[0]
    if (file && file.type.startsWith("image/")) {
      const imageUrl = URL.createObjectURL(file)
      setSelectedImage(imageUrl)
      setGeneratedImage(null)
    }
  }

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
  }

  const handleGenerate = () => {
    if (!selectedImage) return

    setIsGenerating(true)
    // Simulate API call
    setTimeout(() => {
      // For now, just use the same image as a placeholder for the "anime" version
      // In a real app, this would be the URL returned from the API
      setGeneratedImage(selectedImage)
      setIsGenerating(false)
    }, 2000)
  }

  const handleRemoveImage = () => {
    setSelectedImage(null)
    setGeneratedImage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="min-h-screen bg-background p-6 md:p-12">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl font-bold tracking-tight bg-linear-to-r from-pink-500 to-violet-500 bg-clip-text text-transparent">
              Anime Photo Generator
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Transform your photos into anime style masterpieces instantly.
            </p>
          </motion.div>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Upload Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <Card className="h-full overflow-hidden border-2 border-dashed border-muted-foreground/20 hover:border-muted-foreground/40 transition-colors">
              <CardContent className="p-0 h-full">
                {!selectedImage ? (
                  <div
                    className="flex flex-col items-center justify-center h-100 cursor-pointer bg-muted/30 hover:bg-muted/50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                  >
                    <div className="p-4 rounded-full bg-background shadow-sm mb-4">
                      <Upload className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="text-lg font-medium">Click or drag image to upload</p>
                    <p className="text-sm text-muted-foreground mt-1">Supports JPG, PNG, WEBP</p>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileSelect}
                    />
                  </div>
                ) : (
                  <div className="relative h-100 w-full bg-black/5 group">
                    <img
                      src={selectedImage}
                      alt="Original upload"
                      className="w-full h-full object-contain p-4"
                    />
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={handleRemoveImage}
                        className="rounded-full"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm backdrop-blur-sm">
                      Original
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Result Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <Card className="h-full overflow-hidden border-2 border-muted/50">
              <CardContent className="p-0 h-full relative">
                {generatedImage ? (
                  <div className="relative h-100 w-full bg-linear-to-br from-pink-50 to-violet-50 dark:from-pink-950/20 dark:to-violet-950/20">
                    <img
                      src={generatedImage}
                      alt="Anime version"
                      className="w-full h-full object-contain p-4"
                    />
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-linear-to-r from-pink-500 to-violet-500 text-white px-3 py-1 rounded-full text-sm shadow-lg flex items-center gap-2">
                      <Sparkles className="w-3 h-3" />
                      Anime Version
                    </div>
                    <div className="absolute top-4 right-4">
                      <Button
                        variant="secondary"
                        size="icon"
                        className="rounded-full shadow-md"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-100 bg-muted/10 text-muted-foreground">
                    <div className="p-4 rounded-full bg-muted/20 mb-4">
                      <ImageIcon className="w-8 h-8 opacity-50" />
                    </div>
                    <p className="font-medium">Generated image will appear here</p>
                  </div>
                )}

                {/* Loading Overlay */}
                <AnimatePresence>
                  {isGenerating && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center z-10"
                    >
                      <div className="relative">
                        <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Wand2 className="w-6 h-6 text-primary animate-pulse" />
                        </div>
                      </div>
                      <p className="mt-4 font-medium text-primary animate-pulse">
                        Creating magic...
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Action Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="flex justify-center pt-4"
        >
          <Button
            size="lg"
            onClick={handleGenerate}
            disabled={!selectedImage || isGenerating}
            className={cn(
              "rounded-full px-8 h-12 text-lg font-medium transition-all duration-300",
              selectedImage && !isGenerating
                ? "bg-linear-to-r from-pink-500 to-violet-600 hover:shadow-lg hover:shadow-pink-500/25 hover:scale-105"
                : ""
            )}
          >
            {isGenerating ? (
              <>Generating...</>
            ) : (
              <>
                <Sparkles className="mr-2 w-5 h-5" />
                Generate Anime Photo
              </>
            )}
          </Button>
        </motion.div>
      </div>
    </div>
  )
}
