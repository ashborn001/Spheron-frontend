import { useState } from "react";
import axios from "axios";
import "./App.css";

export default function App() {
  const [userInput, setUserInput] = useState("");
  const [isRaised, setIsRaised] = useState(false);
  const [submittedPrompt, setSubmittedPrompt] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [serverMessage, setServerMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (event) => {
    setUserInput(event.target.value);
  };

  const handleSendMessage = () => {
    if (userInput.trim() !== "") {
      setSubmittedPrompt(userInput.trim());
      setIsLoading(true);

      const requestData = { question: userInput.trim() };
      console.log("Sending request:", requestData);

      axios
        .post("https://spheron-model.onrender.com/generate_yaml", requestData, {
          headers: { "Content-Type": "application/json" },
        })
        .then((response) => {
          console.log("Response received:", response.data);
          setServerMessage(response.data.yaml);
        })
        .catch((error) => {
          console.error("Error fetching data:", error);
          setServerMessage("Failed to connect to the server.");
        })
        .finally(() => {
          setIsLoading(false);
        });

      setUserInput("");
      setIsRaised(true);
      setIsSubmitted(true);
    }
  };

  const handleEditPrompt = () => {
    setUserInput(submittedPrompt);
    setIsSubmitted(false);
    setServerMessage("");
  };

  const processLine = (line) => {
    let processedLine = line;
    const parts = [];
    let currentIndex = 0;

    const patterns = [
      {
        type: 'quoted',
        regex: /"[^"]+"/g,
        color: '#10B981'
      },
      {
        type: 'number',
        regex: /(?<!")(\b\d+(?:\.\d+)?)\b(?!")/g,
        color: '#3B82F6'
      },
      {
        type: 'key',
        regex: /^[ -]*([a-zA-Z_][a-zA-Z0-9_-]*?):/gm,
        color: '#F97316'
      }
    ];

    const matches = [];
    
    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.regex.exec(line)) !== null) {
        matches.push({
          start: match.index,
          end: match.index + match[0].length,
          text: match[0],
          type: pattern.type,
          color: pattern.color
        });
      }
    });

    matches.sort((a, b) => a.start - b.start);

    const filteredMatches = matches.reduce((acc, curr) => {
      if (acc.length === 0) return [curr];
      const prev = acc[acc.length - 1];
      if (curr.start >= prev.end) {
        acc.push(curr);
      }
      return acc;
    }, []);

    filteredMatches.forEach((match, index) => {
      if (match.start > currentIndex) {
        parts.push(line.substring(currentIndex, match.start));
      }
      
      parts.push(
        <span key={`${match.type}-${index}`} style={{ color: match.color }}>
          {match.text}
        </span>
      );
      
      currentIndex = match.end;
    });

    if (currentIndex < line.length) {
      parts.push(line.substring(currentIndex));
    }

    return parts;
  };

  return (
    <div className="container">
      <div className={`main ${isRaised ? "raised" : ""}`}>
        <img src="https://app.spheron.network/logo192.png" alt="" />
        <p>SPHERON YAML GENERATOR</p>
      </div>

      {!isSubmitted ? (
        <div className={`input-section ${isRaised ? "raised" : ""}`}>
          <div className="input-container">
            <input
              className="text-input"
              type="text"
              value={userInput}
              onChange={handleInputChange}
              placeholder="Write your prompt here"
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            />
            <button
              className="send-button"
              onClick={handleSendMessage}
              aria-label="Send"
            >
              <img
                src="https://cdn-icons-png.flaticon.com/128/7130/7130816.png"
                alt=""
              />
            </button>
          </div>
        </div>
      ) : (
        <div className={`prompt-display raised`}>
          <p><strong>Prompt:</strong> {submittedPrompt}</p>
          <button onClick={handleEditPrompt}>Edit Prompt</button>
        </div>
      )}

      {isSubmitted && (
        <div className="response-display">
          {isLoading ? (
            <p>Loading...</p>
          ) : (
            <div style={{ 
              backgroundColor: '#111827', 
              borderRadius: '30px', 
              padding: '1.5rem', 
              fontFamily: 'monospace', 
              fontSize: '0.875rem' 
            }}>
              <pre style={{ 
                whiteSpace: 'pre-wrap', 
                wordBreak: 'break-words', 
                color: '#D1D5DB' 
              }}>
                {serverMessage.split('\n').map((line, index) => (
                  <div key={index} style={{ lineHeight: '1.5' }}>
                    {processLine(line)}
                  </div>
                ))}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 
