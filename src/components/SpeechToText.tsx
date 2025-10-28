import { useState, useRef } from "react";
import { Button } from "./ui/button";
import { Mic, StopCircle, Loader2, Play } from "lucide-react";
import { toast } from "sonner";

export function SpeechToText({ onTranscription }: { onTranscription: (text: string) => void }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioUrlRef = useRef<string>("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [hasRecording, setHasRecording] = useState(false);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        audioUrlRef.current = URL.createObjectURL(audioBlob);
        if (audioRef.current) {
          audioRef.current.src = audioUrlRef.current;
        }
        setHasRecording(true);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      toast.info("Grabando... Habla ahora.");
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast.error("No se pudo acceder al micrófono");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      toast.info("Grabación completada");
    }
  };

  const processRecording = async () => {
    if (!audioUrlRef.current) return;

    try {
      setIsProcessing(true);
      toast.info("Procesando audio...");

      // Get the audio blob
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
      
      // Create form data to send to our API route
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');

      // Call our API route that will handle the OpenAI API call
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Error al transcribir el audio');
      }

      const { text } = await response.json();
      
      if (text) {
        onTranscription(text);
        toast.success("Transcripción completada");
      } else {
        throw new Error('No se pudo transcribir el audio');
      }
    } catch (error) {
      console.error("Error processing audio:", error);
      toast.error("Error al procesar el audio. Intente nuevamente.");
    } finally {
      setIsProcessing(false);
    }
  };

  const playRecording = () => {
    if (audioRef.current) {
      audioRef.current.play();
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {!isRecording ? (
          <Button
            type="button"
            onClick={startRecording}
            variant="outline"
            className="gap-2"
            disabled={isProcessing}
          >
            <Mic className="h-4 w-4" />
            {hasRecording ? 'Regrabar' : 'Grabar'}
          </Button>
        ) : (
          <Button
            type="button"
            onClick={stopRecording}
            variant="destructive"
            className="gap-2"
          >
            <StopCircle className="h-4 w-4" />
            Detener
          </Button>
        )}

        {hasRecording && (
          <>
            <Button
              type="button"
              onClick={playRecording}
              variant="ghost"
              size="icon"
              disabled={isProcessing}
            >
              <Play className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              onClick={processRecording}
              disabled={isProcessing}
              className="gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                'Transcribir con IA'
              )}
            </Button>
          </>
        )}
      </div>
      <audio ref={audioRef} className="hidden" />
    </div>
  );
}
