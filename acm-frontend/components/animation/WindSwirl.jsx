export function WindSwirl() {
  return (
    <svg className="wind-swirl" viewBox="0 0 720 520" fill="none" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="wind-indigo" x1="80" y1="100" x2="640" y2="470" gradientUnits="userSpaceOnUse">
          <stop stopColor="#818cf8" stopOpacity=".04" />
          <stop offset=".45" stopColor="#6366f1" stopOpacity=".82" />
          <stop offset="1" stopColor="#7c3aed" stopOpacity=".16" />
        </linearGradient>
        <linearGradient id="wind-violet" x1="110" y1="430" x2="600" y2="90" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4f46e5" stopOpacity=".07" />
          <stop offset=".54" stopColor="#a78bfa" stopOpacity=".65" />
          <stop offset="1" stopColor="#7c3aed" stopOpacity=".07" />
        </linearGradient>
        <linearGradient id="wind-soft" x1="0" y1="200" x2="720" y2="350" gradientUnits="userSpaceOnUse">
          <stop stopColor="#c4b5fd" stopOpacity=".05" />
          <stop offset=".5" stopColor="#818cf8" stopOpacity=".55" />
          <stop offset="1" stopColor="#c4b5fd" stopOpacity=".05" />
        </linearGradient>
        <filter id="blur-ribbon">
          <feGaussianBlur stdDeviation="1.5" />
        </filter>
      </defs>

      {/* Main ribbon (thickest, most visible) */}
      <g className="wind-ribbon wind-ribbon-one">
        <path
          d="M-24 352C92 346 86 216 222 218C340 220 325 336 440 330C558 324 536 172 748 126"
          stroke="url(#wind-indigo)"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      </g>

      {/* Secondary ribbon */}
      <g className="wind-ribbon wind-ribbon-two">
        <path
          d="M-38 395C104 390 136 278 237 274C330 270 371 377 476 368C591 359 592 224 744 208"
          stroke="url(#wind-violet)"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
      </g>

      {/* Thin ribbon */}
      <g className="wind-ribbon wind-ribbon-three">
        <path
          d="M-25 293C115 295 134 151 254 153C383 155 369 249 478 241C584 234 614 116 743 94"
          stroke="url(#wind-indigo)"
          strokeWidth="1.1"
          strokeLinecap="round"
        />
      </g>

      {/* Lower accent ribbon */}
      <g className="wind-ribbon wind-ribbon-four">
        <path
          d="M-34 448C108 420 197 361 278 368C373 376 414 448 529 421C614 401 641 320 752 299"
          stroke="url(#wind-violet)"
          strokeWidth="0.9"
          strokeLinecap="round"
        />
      </g>

      {/* Finest detail ribbon */}
      <path
        className="wind-ribbon-fine"
        d="M-20 330C123 334 145 184 276 190C386 196 392 298 494 292C596 285 626 160 748 148"
        stroke="#c4b5fd"
        strokeOpacity=".45"
        strokeWidth="0.7"
        strokeLinecap="round"
      />

      {/* Additional violet hint ribbon */}
      <path
        className="wind-ribbon wind-ribbon-two"
        d="M-10 410C120 402 185 305 295 308C395 311 430 400 540 385C640 372 660 265 760 250"
        stroke="url(#wind-soft)"
        strokeWidth="0.6"
        strokeLinecap="round"
        style={{ animationDelay: '0.6s' }}
      />

      {/* Accent dots */}
      <g className="wind-points" fill="#a5b4fc">
        <circle cx="173" cy="201" r="2" />
        <circle cx="219" cy="229" r="1.4" />
        <circle cx="299" cy="190" r="1.7" />
        <circle cx="430" cy="329" r="2.1" />
        <circle cx="498" cy="290" r="1.3" />
        <circle cx="547" cy="195" r="1.8" />
        <circle cx="605" cy="154" r="1.3" />
        <circle cx="347" cy="394" r="1.5" />
        <circle cx="257" cy="284" r="1.7" />
        <circle cx="130" cy="330" r="1.1" />
        <circle cx="670" cy="110" r="1.4" />
      </g>

      {/* Glow dots (larger, semi-transparent) */}
      <g fill="#818cf8" opacity="0.12">
        <circle cx="222" cy="218" r="8" />
        <circle cx="440" cy="330" r="6" />
        <circle cx="254" cy="153" r="5" />
      </g>
    </svg>
  );
}
