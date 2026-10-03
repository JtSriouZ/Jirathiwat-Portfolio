/** Public-domain frame: “Ornate frame 41” by Firkin, OpenClipart. */
export default function ArtFrame() {
  return (
    <>
      <svg className="art-frame-filter" aria-hidden="true" focusable="false">
        <filter id="art-frame-theme" colorInterpolationFilters="sRGB">
          <feColorMatrix
            type="matrix"
            values="0.2126 0.7152 0.0722 0 0
                    0.2126 0.7152 0.0722 0 0
                    0.2126 0.7152 0.0722 0 0
                    0 0 0 1 0"
            result="lum"
          />
          <feComponentTransfer in="lum" result="stretch">
            <feFuncR type="linear" slope="2.35" intercept="-1.15" />
            <feFuncG type="linear" slope="2.35" intercept="-1.15" />
            <feFuncB type="linear" slope="2.35" intercept="-1.15" />
          </feComponentTransfer>
          <feComponentTransfer in="stretch">
            <feFuncR type="linear" slope="0.416" intercept="0.490" />
            <feFuncG type="linear" slope="0.384" intercept="0.533" />
            <feFuncB type="linear" slope="0.098" intercept="0.902" />
          </feComponentTransfer>
        </filter>
        <filter id="art-frame-hot" colorInterpolationFilters="sRGB">
          <feColorMatrix
            type="matrix"
            values="0.2126 0.7152 0.0722 0 0
                    0.2126 0.7152 0.0722 0 0
                    0.2126 0.7152 0.0722 0 0
                    0 0 0 1 0"
            result="lum"
          />
          <feComponentTransfer in="lum" result="stretch">
            <feFuncR type="linear" slope="2.35" intercept="-1.15" />
            <feFuncG type="linear" slope="2.35" intercept="-1.15" />
            <feFuncB type="linear" slope="2.35" intercept="-1.15" />
          </feComponentTransfer>
          <feComponentTransfer in="stretch">
            <feFuncR type="linear" slope="0.047" intercept="0" />
            <feFuncG type="linear" slope="0.102" intercept="0.039" />
            <feFuncB type="linear" slope="0.353" intercept="0.549" />
          </feComponentTransfer>
        </filter>
      </svg>
      <img
        className="art-frame"
        src="/ornament/frame-41.svg"
        alt=""
      />
    </>
  );
}
