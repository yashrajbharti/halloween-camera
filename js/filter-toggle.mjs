class FilterToggle extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._enabled = true;
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-block;
        }

        button {
          all: unset;
          cursor: pointer;
        }

        .toggle-container {
          position: relative;
          inline-size: 72px;
          block-size: 40px;
          background-color: var(--toggle-bg-off, #6b7280);
          border-radius: 40px;
          border: 2px solid var(--toggle-border-off, #9ca3af);
          cursor: pointer;
          transition: background-color 0.3s ease, border-color 0.3s ease;
        }

        .toggle-container.enabled {
          background-color: var(--toggle-bg-on, rgba(249, 115, 22, 0.6));
          border-color: var(--toggle-border-on, #F97316);
        }

        .toggle-thumb {
          position: absolute;
          inset-block-start: 50%;
          inset-inline-start: 2px;
          inline-size: 36px;
          block-size: 36px;
          background-color: rgba(45, 13, 4, 0.9);
          border-radius: 50%;
          transform: translateY(-50%);
          transition: inset-inline-start 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          line-height: 1;
          user-select: none;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }

        .toggle-container.enabled .toggle-thumb {
          inset-inline-start: calc(100% - 36px - 2px);
        }

        .toggle-container:hover {
          background-color: var(--toggle-bg-off-hover, #4b5563);
        }

        .toggle-container.enabled:hover {
          background-color: var(--toggle-bg-on-hover, rgba(249, 115, 22, 0.75));
        }

        .toggle-container:active .toggle-thumb {
          inline-size: 38px;
        }

        @media (prefers-reduced-motion: reduce) {
          .toggle-thumb {
            transition: none;
          }
        }
      </style>

      <button class="toggle-container ${
        this._enabled ? "enabled" : ""
      }" type="button" role="switch" aria-checked="${
      this._enabled
    }" aria-label="Toggle filter">
        <span class="toggle-thumb" aria-hidden="true">
          🎃
        </span>
      </button>
    `;
  }

  setupEventListeners() {
    const container = this.shadowRoot.querySelector(".toggle-container");

    const toggle = () => {
      this._enabled = !this._enabled;
      this.updateUI();
      this.dispatchEvent(
        new CustomEvent("toggle", {
          detail: { enabled: this._enabled },
          bubbles: true,
          composed: true,
        })
      );
    };

    container.addEventListener("click", toggle);

    container.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggle();
      }
    });
  }

  updateUI() {
    const container = this.shadowRoot.querySelector(".toggle-container");
    if (this._enabled) {
      container.classList.add("enabled");
    } else {
      container.classList.remove("enabled");
    }
    container.setAttribute("aria-checked", this._enabled);
  }

  get enabled() {
    return this._enabled;
  }

  set enabled(value) {
    this._enabled = value;
    this.updateUI();
  }
}

customElements.define("filter-toggle", FilterToggle);
