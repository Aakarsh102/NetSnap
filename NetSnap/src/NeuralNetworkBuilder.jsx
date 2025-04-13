import React, { useState, useRef } from 'react';
import { ArrowRight, Plus, Trash2, Save, Download, Play } from 'lucide-react';

// Main App Component
export default function NeuralNetworkBuilder() {
  const [layers, setLayers] = useState([]);
  const [inputDimension, setInputDimension] = useState(784); // Default for MNIST
  const [selectedLayer, setSelectedLayer] = useState(null);
  const [draggedLayer, setDraggedLayer] = useState(null);
  const [showModelPage, setShowModelPage] = useState(false);
  const workspaceRef = useRef(null);
  
  // Available layer types with their default settings
  const layerTypes = [
    {
      type: 'Linear',
      icon: '⚡',
      color: 'bg-amber-100',
      defaultSettings: {
        in_features: null, // Will be auto-adjusted
        out_features: 128,
        bias: true,
        activation: 'ReLU'
      }
    },
    {
      type: 'Conv2d',
      icon: '🔳',
      color: 'bg-amber-200',
      defaultSettings: {
        in_channels: null, // Will be auto-adjusted
        out_channels: 32,
        kernel_size: 3,
        stride: 1,
        padding: 1,
        bias: true,
        activation: 'ReLU'
      }
    },
    {
      type: 'BatchNorm2d',
      icon: '📊',
      color: 'bg-amber-100',
      defaultSettings: {
        num_features: null, // Will be auto-adjusted
        eps: 1e-5,
        momentum: 0.1,
        affine: true,
        track_running_stats: true
      }
    },
    {
      type: 'Dropout',
      icon: '💧',
      color: 'bg-amber-200',
      defaultSettings: {
        p: 0.5,
        inplace: false
      }
    },
    {
      type: 'MultiheadAttention',
      icon: '👁️',
      color: 'bg-amber-100',
      defaultSettings: {
        embed_dim: null, // Will be auto-adjusted
        num_heads: 8,
        dropout: 0.1,
        bias: true,
        add_bias_kv: false,
        add_zero_attn: false,
        kdim: null,
        vdim: null
      }
    },
    {
      type: 'MaxPool2d',
      icon: '⬇️',
      color: 'bg-amber-200',
      defaultSettings: {
        kernel_size: 2,
        stride: 2,
        padding: 0,
        dilation: 1,
        return_indices: false,
        ceil_mode: false
      }
    },
    {
      type: 'Flatten',
      icon: '📄',
      color: 'bg-amber-100',
      defaultSettings: {
        start_dim: 1,
        end_dim: -1
      }
    }
  ];
  
  // Handle drag start from sidebar
  const handleDragStart = (e, layerType) => {
    setDraggedLayer(layerType);
  };
  
  // Handle drop on workspace
  const handleDrop = (e) => {
    e.preventDefault();
    
    if (!draggedLayer) return;
    
    // Get workspace position for placement
    const rect = workspaceRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Create a new layer with auto-adjusted input dimension
    const prevLayerOutDim = layers.length > 0 ? getOutputDimension(layers[layers.length - 1]) : inputDimension;
    
    const newLayerType = layerTypes.find(lt => lt.type === draggedLayer);
    const newSettings = { ...newLayerType.defaultSettings };
    
    // Auto-adjust input dimensions based on previous layer's output
    if (newLayerType.type === 'Linear') {
      newSettings.in_features = prevLayerOutDim;
    } else if (newLayerType.type === 'Conv2d') {
      newSettings.in_channels = typeof prevLayerOutDim === 'number' ? prevLayerOutDim : prevLayerOutDim.channels;
    } else if (newLayerType.type === 'BatchNorm2d') {
      newSettings.num_features = typeof prevLayerOutDim === 'number' ? prevLayerOutDim : prevLayerOutDim.channels;
    } else if (newLayerType.type === 'MultiheadAttention') {
      newSettings.embed_dim = prevLayerOutDim;
    }
    
    const newLayer = {
      id: Date.now(),
      type: draggedLayer,
      position: { x, y },
      settings: newSettings
    };
    
    setLayers([...layers, newLayer]);
    setSelectedLayer(newLayer.id);
    setDraggedLayer(null);
  };
  
  // Calculate output dimension of a layer
  const getOutputDimension = (layer) => {
    if (layer.type === 'Linear') {
      return layer.settings.out_features;
    } else if (layer.type === 'Conv2d') {
      // For simplicity, we're just returning the out_channels
      // In a real app, we'd calculate spatial dimensions too
      return {
        channels: layer.settings.out_channels,
        type: '2d'
      };
    } else if (layer.type === 'BatchNorm2d' || layer.type === 'Dropout') {
      // These layers don't change dimensions
      return layer.settings.num_features || inputDimension;
    } else if (layer.type === 'MultiheadAttention') {
      return layer.settings.embed_dim;
    } else if (layer.type === 'MaxPool2d') {
      // For simplicity, we maintain the same number of channels
      // In a real app, we'd calculate the reduced spatial dimensions
      return inputDimension;
    } else if (layer.type === 'Flatten') {
      // Flattening typically results in a 1D tensor
      // This is a simplification
      return 1000; // Placeholder
    }
    return inputDimension;
  };
  
  // Update layer settings
  const updateLayerSettings = (id, newSettings) => {
    setLayers(layers.map(layer => 
      layer.id === id ? { ...layer, settings: { ...layer.settings, ...newSettings } } : layer
    ));
  };
  
  // Delete a layer
  const deleteLayer = (id) => {
    setLayers(layers.filter(layer => layer.id !== id));
    if (selectedLayer === id) setSelectedLayer(null);
  };
  
  // Generate the JSON model representation
  const generateModel = () => {
    const modelJSON = {
      input_dim: inputDimension,
      layers: layers.map(layer => ({
        type: layer.type,
        settings: { ...layer.settings }
      }))
    };
    
    return modelJSON;
  };
  
  // Handle Generate Model button click
  const handleGenerateModel = () => {
    setShowModelPage(true);
  };
  
  // Handle drag over
  const handleDragOver = (e) => {
    e.preventDefault();
  };
  
  // Download model as JSON
  const downloadModel = () => {
    const modelJSON = generateModel();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(modelJSON, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "neural_network_model.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  // Generate the PyTorch code
  const generatePyTorchCode = () => {
    const modelJSON = generateModel();
    
    let imports = `import torch\nimport torch.nn as nn\n`;
    
    let classDefinition = `\nclass NeuralNetwork(nn.Module):\n    def __init__(self):\n        super(NeuralNetwork, self).__init__()\n`;
    let forwardMethod = `\n    def forward(self, x):\n`;
    
    // Add layers to the class definition
    modelJSON.layers.forEach((layer, index) => {
      if (layer.type === 'Linear') {
        classDefinition += `        self.fc${index} = nn.Linear(${layer.settings.in_features}, ${layer.settings.out_features}, bias=${layer.settings.bias})\n`;
        if (layer.settings.activation !== 'None') {
          classDefinition += `        self.act${index} = nn.${layer.settings.activation}()\n`;
        }
        
        forwardMethod += `        x = self.fc${index}(x)\n`;
        if (layer.settings.activation !== 'None') {
          forwardMethod += `        x = self.act${index}(x)\n`;
        }
      } else if (layer.type === 'Conv2d') {
        classDefinition += `        self.conv${index} = nn.Conv2d(${layer.settings.in_channels}, ${layer.settings.out_channels}, kernel_size=${layer.settings.kernel_size}, stride=${layer.settings.stride}, padding=${layer.settings.padding}, bias=${layer.settings.bias})\n`;
        if (layer.settings.activation !== 'None') {
          classDefinition += `        self.act${index} = nn.${layer.settings.activation}()\n`;
        }
        
        forwardMethod += `        x = self.conv${index}(x)\n`;
        if (layer.settings.activation !== 'None') {
          forwardMethod += `        x = self.act${index}(x)\n`;
        }
      } else if (layer.type === 'BatchNorm2d') {
        classDefinition += `        self.bn${index} = nn.BatchNorm2d(${layer.settings.num_features}, eps=${layer.settings.eps}, momentum=${layer.settings.momentum}, affine=${layer.settings.affine}, track_running_stats=${layer.settings.track_running_stats})\n`;
        forwardMethod += `        x = self.bn${index}(x)\n`;
      } else if (layer.type === 'Dropout') {
        classDefinition += `        self.dropout${index} = nn.Dropout(p=${layer.settings.p}, inplace=${layer.settings.inplace})\n`;
        forwardMethod += `        x = self.dropout${index}(x)\n`;
      } else if (layer.type === 'MaxPool2d') {
        classDefinition += `        self.maxpool${index} = nn.MaxPool2d(kernel_size=${layer.settings.kernel_size}, stride=${layer.settings.stride}, padding=${layer.settings.padding})\n`;
        forwardMethod += `        x = self.maxpool${index}(x)\n`;
      } else if (layer.type === 'Flatten') {
        classDefinition += `        self.flatten${index} = nn.Flatten(start_dim=${layer.settings.start_dim}, end_dim=${layer.settings.end_dim})\n`;
        forwardMethod += `        x = self.flatten${index}(x)\n`;
      } else if (layer.type === 'MultiheadAttention') {
        classDefinition += `        self.mha${index} = nn.MultiheadAttention(embed_dim=${layer.settings.embed_dim}, num_heads=${layer.settings.num_heads}, dropout=${layer.settings.dropout})\n`;
        forwardMethod += `        # Note: For MultiheadAttention, implementation depends on your data structure\n`;
        forwardMethod += `        # This is a placeholder. Adjust accordingly.\n`;
        forwardMethod += `        # x, _ = self.mha${index}(x, x, x)\n`;
      }
    });
    
    forwardMethod += `        return x\n`;
    
    // Create the model instantiation code
    const modelCreation = `\n# Create the model\nmodel = NeuralNetwork()\n`;
    
    // Combine everything
    return imports + classDefinition + forwardMethod + modelCreation;
  };

  // If showing the model page
  if (showModelPage) {
    return (
      <div className="min-h-screen bg-amber-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-amber-900">Neural Network Model</h1>
            <div className="space-x-4">
              <button 
                onClick={() => setShowModelPage(false)}
                className="bg-amber-600 hover:bg-amber-700 text-white font-medium py-2 px-4 rounded"
              >
                Back to Editor
              </button>
              <button 
                onClick={downloadModel}
                className="bg-amber-800 hover:bg-amber-900 text-white font-medium py-2 px-4 rounded flex items-center"
              >
                <Download className="w-4 h-4 mr-2" />
                Download JSON
              </button>
            </div>
          </div>
          
          {/* Model Visualization */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-amber-900 mb-4">Model Architecture</h2>
            <div className="space-y-4">
              <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                <div className="font-medium text-amber-800">Input Dimension: {inputDimension}</div>
              </div>
              
              {layers.map((layer, index) => {
                const layerType = layerTypes.find(lt => lt.type === layer.type);
                return (
                  <div key={layer.id} className="relative">
                    {/* Arrow connecting layers */}
                    {index > 0 && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                        <ArrowRight className="w-5 h-5 text-amber-500 transform rotate-90" />
                      </div>
                    )}
                    
                    <div className={`${layerType?.color || 'bg-amber-100'} p-4 rounded-lg border border-amber-300`}>
                      <div className="flex items-center mb-2">
                        <span className="text-xl mr-2">{layerType?.icon}</span>
                        <span className="font-bold text-amber-900">{layer.type}</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {Object.entries(layer.settings).filter(([key, value]) => value !== null).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="font-medium text-amber-800">{key}:</span>
                            <span>{typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* PyTorch Code */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-amber-900 mb-4">PyTorch Code</h2>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-auto max-h-96">
              {generatePyTorchCode()}
            </pre>
            <button 
              onClick={() => {
                const el = document.createElement('textarea');
                el.value = generatePyTorchCode();
                document.body.appendChild(el);
                el.select();
                document.execCommand('copy');
                document.body.removeChild(el);
                alert('PyTorch code copied to clipboard!');
              }}
              className="mt-4 bg-gray-800 hover:bg-gray-900 text-white font-medium py-2 px-4 rounded"
            >
              Copy Code
            </button>
          </div>
          
          {/* JSON Output */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-amber-900 mb-4">JSON Model</h2>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-auto max-h-96">
              {JSON.stringify(generateModel(), null, 2)}
            </pre>
          </div>
        </div>
      </div>
    );
  }

  // Main editor view
  return (
    <div className="flex h-screen bg-amber-50">
      {/* Sidebar */}
      <div className="w-64 bg-amber-100 p-4 shadow-lg">
        <h1 className="text-2xl font-bold mb-4 text-amber-900">Layers</h1>
        
        {/* Input dimension setting */}
        <div className="mb-4">
          <label className="block text-amber-800 font-medium mb-1">Input Dimension</label>
          <input 
            type="number" 
            value={inputDimension} 
            onChange={(e) => setInputDimension(parseInt(e.target.value))}
            className="w-full p-2 border border-amber-300 rounded focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
        
        {/* Available layers */}
        <div className="space-y-2">
          {layerTypes.map((layerType) => (
            <div
              key={layerType.type}
              draggable
              onDragStart={(e) => handleDragStart(e, layerType.type)}
              className={`${layerType.color} p-3 rounded-lg shadow cursor-move flex items-center hover:shadow-md transition-shadow`}
            >
              <span className="text-xl mr-2">{layerType.icon}</span>
              <span className="font-medium text-amber-900">{layerType.type}</span>
            </div>
          ))}
        </div>
        
        {/* Actions */}
        <div className="mt-6 space-y-2">
          <button 
            onClick={handleGenerateModel}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-medium py-2 px-4 rounded flex items-center justify-center"
          >
            <Play className="w-4 h-4 mr-2" />
            Generate Model
          </button>
          
          <button 
            onClick={downloadModel}
            className="w-full bg-amber-700 hover:bg-amber-800 text-white font-medium py-2 px-4 rounded flex items-center justify-center"
          >
            <Download className="w-4 h-4 mr-2" />
            Download JSON
          </button>
        </div>
      </div>
      
      {/* Workspace */}
      <div 
        ref={workspaceRef}
        className="flex-1 p-6 relative overflow-auto"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <h1 className="text-2xl font-bold mb-6 text-amber-900">Neural Network Designer</h1>
        
        {/* Network visualization */}
        <div className="relative min-h-full border-2 border-dashed border-amber-300 rounded-lg p-4">
          {layers.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-amber-400 text-lg">
              Drag and drop layers from the sidebar to build your neural network
            </div>
          )}
          
          {/* Render layers */}
          {layers.map((layer, index) => {
            const layerType = layerTypes.find(lt => lt.type === layer.type);
            return (
              <div 
                key={layer.id}
                style={{ 
                  position: index === 0 ? 'relative' : 'relative',
                  marginTop: index === 0 ? '0' : '16px'
                }}
                className={`${layerType?.color || 'bg-amber-100'} p-4 rounded-lg shadow-md max-w-md mx-auto`}
                onClick={() => setSelectedLayer(layer.id)}
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center">
                    <span className="text-xl mr-2">{layerType?.icon}</span>
                    <span className="font-bold text-amber-900">{layer.type}</span>
                  </div>
                  <button 
                    onClick={() => deleteLayer(layer.id)}
                    className="text-amber-700 hover:text-amber-900"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
                
                {/* Connection arrow */}
                {index > 0 && (
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
                    <ArrowRight className="w-6 h-6 text-amber-500 transform rotate-90" />
                  </div>
                )}
                
                {/* Layer settings */}
                <div className="space-y-2 mt-2">
                  {Object.entries(layer.settings).map(([key, value]) => (
                    <div key={key} className="flex items-center">
                      <span className="text-sm font-medium text-amber-800 w-1/3">{key}:</span>
                      {key === 'activation' ? (
                        <select 
                          value={value}
                          onChange={(e) => updateLayerSettings(layer.id, { [key]: e.target.value })}
                          className="ml-2 p-1 text-sm border border-amber-300 rounded flex-1"
                        >
                          <option value="ReLU">ReLU</option>
                          <option value="Sigmoid">Sigmoid</option>
                          <option value="Tanh">Tanh</option>
                          <option value="LeakyReLU">LeakyReLU</option>
                          <option value="ELU">ELU</option>
                          <option value="None">None</option>
                        </select>
                      ) : key === 'bias' || key === 'affine' || key === 'track_running_stats' || 
                         key === 'inplace' || key === 'add_bias_kv' || key === 'add_zero_attn' ||
                         key === 'return_indices' || key === 'ceil_mode' ? (
                        <input 
                          type="checkbox"
                          checked={value}
                          onChange={(e) => updateLayerSettings(layer.id, { [key]: e.target.checked })}
                          className="ml-2"
                        />
                      ) : (
                        <input 
                          type="number"
                          value={value}
                          onChange={(e) => updateLayerSettings(layer.id, { [key]: parseFloat(e.target.value) })}
                          disabled={key.includes('in_') && value === null} // Disable auto-adjusted inputs
                          className="ml-2 p-1 text-sm border border-amber-300 rounded flex-1"
                          placeholder={key.includes('in_') && value === null ? "Auto" : ""}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* JSON Preview Panel */}
      <div className="w-64 bg-amber-100 p-4 shadow-lg overflow-auto">
        <h2 className="text-lg font-bold mb-2 text-amber-900">JSON Preview</h2>
        <pre className="text-xs bg-white p-2 rounded overflow-auto max-h-96">
          {JSON.stringify(generateModel(), null, 2)}
        </pre>
      </div>
    </div>
  );
}