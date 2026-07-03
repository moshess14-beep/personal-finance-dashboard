import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'

export default function SuccessMessage({ message }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="flex items-center gap-1.5 text-sm font-medium text-gain"
          role="status"
        >
          <CheckCircle2 className="size-4 shrink-0" />
          {message}
        </motion.p>
      )}
    </AnimatePresence>
  )
}
