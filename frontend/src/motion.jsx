import { motion, useReducedMotion } from "framer-motion";

/* ============================================================
   Shared motion language.
   Everything enters on the same curve as the CSS --ease token and
   always respects prefers-reduced-motion.
   ============================================================ */

const EASE = [0.22, 1, 0.36, 1];

export const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.72, ease: EASE, delay: i * 0.07 },
  }),
};

export const fadeIn = {
  hidden: { opacity: 0 },
  show: (i = 0) => ({
    opacity: 1,
    transition: { duration: 0.9, ease: EASE, delay: i * 0.07 },
  }),
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.96, y: 14 },
  show: (i = 0) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.8, ease: EASE, delay: i * 0.08 },
  }),
};

/** Drifts in from the side it is named for — used for the section eyebrows. */
export const slideIn = (from = 22) => ({
  hidden: { opacity: 0, x: from },
  show: (i = 0) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.7, ease: EASE, delay: i * 0.06 },
  }),
});

/** Reveals children one after another as the block enters the viewport. */
export function Stagger({ children, className, gap = 0.09, once = true, amount = 0.25, ...rest }) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once, amount }}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: reduced ? 0 : gap } },
      }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

export function Item({ children, className, variants = fadeUp, as = "div", ...rest }) {
  const MotionTag = motion[as] || motion.div;
  return (
    <MotionTag className={className} variants={variants} {...rest}>
      {children}
    </MotionTag>
  );
}

/** Single-shot on-scroll reveal, for one-off blocks that own their own timing. */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 22,
  blur = true,
  amount = 0.35,
  once = true,
  as = "div",
  ...rest
}) {
  const reduced = useReducedMotion();
  const MotionTag = motion[as] || motion.div;

  if (reduced) {
    return (
      <MotionTag className={className} initial={false} {...rest}>
        {children}
      </MotionTag>
    );
  }

  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y, filter: blur ? "blur(7px)" : "none" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once, amount }}
      transition={{ duration: 0.85, ease: EASE, delay }}
      {...rest}
    >
      {children}
    </MotionTag>
  );
}

/** Hairline rule that draws itself across when scrolled into view. */
export function DrawLine({ className, delay = 0 }) {
  const reduced = useReducedMotion();

  if (reduced) {
    return <span className={className} />;
  }

  return (
    <motion.span
      className={className}
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true, amount: 0.9 }}
      transition={{ duration: 1.1, ease: EASE, delay }}
    />
  );
}
